// Nearby friends over pub/sub channels. Edit me and press Run.
K.title(
  "Nearby friends",
  "Each user publishes location to their own channel; friends subscribe. Only friends inside the radius are shown as nearby.",
);

K.section("Controls");
const users = K.slider("Users", 10, 300, 60, 10, () => init());
const friendsPer = K.slider("Friends per user", 1, 30, 6, 1, () => init());
const radius = K.slider("Radius (% of map)", 2, 40, 12, 1);
const interval = K.slider("Update every (ticks)", 1, 20, 3, 1);
const st = K.stats({
  pubs: "Publishes / s",
  msgs: "Messages delivered / s",
  useful: "Useful (in range)",
  me: "Your nearby friends",
});
const cv = K.canvas(360, () => draw());
const chart = K.chart([{ name: "messages / s" }, { name: "in-range messages / s" }], { height: 120 });
let U = [],
  tick = 0,
  pubs = 0,
  msgs = 0,
  useful = 0;
function init() {
  const rnd = K.rng(9);
  U = Array.from({ length: users.value }, (_, i) => ({
    i,
    x: rnd(),
    y: rnd(),
    vx: (rnd() - 0.5) * 0.01,
    vy: (rnd() - 0.5) * 0.01,
    friends: new Set(),
    phase: Math.floor(rnd() * 20),
  }));
  for (const u of U)
    while (u.friends.size < Math.min(friendsPer.value, U.length - 1)) {
      const f = Math.floor(rnd() * U.length);
      if (f !== u.i) {
        u.friends.add(f);
        U[f].friends.add(u.i);
      }
    }
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const me = U[0],
    r = radius.value / 100,
    S = 350,
    ox = (width - S) / 2;
  ctx.strokeStyle = K.color("line");
  ctx.strokeRect(ox, 5, S, S);
  ctx.strokeStyle = K.color("c1");
  ctx.beginPath();
  ctx.arc(ox + me.x * S, 5 + me.y * S, r * S, 0, 7);
  ctx.stroke();
  let near = 0;
  for (const u of U) {
    const isF = me.friends.has(u.i),
      inR = Math.hypot(u.x - me.x, u.y - me.y) <= r;
    if (isF && inR) near++;
    ctx.fillStyle = K.color(u === me ? "c1" : isF ? (inR ? "c2" : "c3") : "muted");
    ctx.globalAlpha = isF || u === me ? 1 : 0.35;
    ctx.beginPath();
    ctx.arc(ox + u.x * S, 5 + u.y * S, u === me ? 6 : isF ? 4 : 2.5, 0, 7);
    ctx.fill();
    if (u.flash > 0 && isF) {
      ctx.strokeStyle = K.color("c2");
      ctx.beginPath();
      ctx.moveTo(ox + u.x * S, 5 + u.y * S);
      ctx.lineTo(ox + me.x * S, 5 + me.y * S);
      ctx.globalAlpha = 0.4;
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("blue: you · orange: friend in range · green: friend out of range", ox, 358);
  st.set("me", near);
}
init();
K.loop(() => {
  tick++;
  const r = radius.value / 100;
  for (const u of U) {
    u.x = Math.min(1, Math.max(0, u.x + u.vx));
    u.y = Math.min(1, Math.max(0, u.y + u.vy));
    if (u.x <= 0 || u.x >= 1) u.vx *= -1;
    if (u.y <= 0 || u.y >= 1) u.vy *= -1;
    u.flash = Math.max(0, (u.flash || 0) - 1);
    if ((tick + u.phase) % interval.value === 0) {
      // publish to my channel → every friend's websocket server
      pubs++;
      u.flash = 2;
      for (const f of u.friends) {
        msgs++;
        if (Math.hypot(U[f].x - u.x, U[f].y - u.y) <= r) useful++;
      }
    }
  }
  draw();
  if (tick % 10 === 0) {
    chart.push(msgs, useful);
    st.setAll({ pubs, msgs });
    st.set("useful", msgs ? Math.round((100 * useful) / msgs) + "%" : "–");
    pubs = msgs = useful = 0;
  }
}, 100);
