// UI only: a map of moving users and charts of the message rates LocationPubSub reports.
import { createWorld, moveUsers, distance } from "./world.js";
import { LocationPubSub } from "./location_pubsub.js";

K.title(
  "Nearby friends",
  "Each user publishes location to their own channel; friends subscribe. Only friends inside the radius are shown as nearby.",
);

K.section("Controls");
const userCount = K.slider("Users", 10, 300, 60, 10, () => init());
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

let users = [];
let pubsub;
let tick = 0;
let second = { publishes: 0, delivered: 0, inRange: 0 };
let justPublished = new Set();

function init() {
  users = createWorld(userCount.value, friendsPer.value, K.rng(9));
  pubsub = new LocationPubSub(users);
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const me = users[0];
  const r = radius.value / 100;
  const size = 350;
  const left = (width - size) / 2;
  const X = (x) => left + x * size;
  const Y = (y) => 5 + y * size;
  ctx.strokeStyle = K.color("line");
  ctx.strokeRect(left, 5, size, size);
  ctx.strokeStyle = K.color("c1");
  ctx.beginPath();
  ctx.arc(X(me.x), Y(me.y), r * size, 0, 7);
  ctx.stroke();
  let nearby = 0;
  for (const u of users) {
    const isFriend = me.friends.has(u.id);
    const inRange = distance(u, me) <= r;
    if (isFriend && inRange) nearby++;
    ctx.fillStyle = K.color(u === me ? "c1" : isFriend ? (inRange ? "c2" : "c3") : "muted");
    ctx.globalAlpha = isFriend || u === me ? 1 : 0.35;
    ctx.beginPath();
    ctx.arc(X(u.x), Y(u.y), u === me ? 6 : isFriend ? 4 : 2.5, 0, 7);
    ctx.fill();
    if (isFriend && justPublished.has(u.id)) {
      // a location message travelling from a friend to you
      ctx.strokeStyle = K.color("c2");
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(X(u.x), Y(u.y));
      ctx.lineTo(X(me.x), Y(me.y));
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("blue: you · orange: friend in range · green: friend out of range", left, 358);
  st.set("me", nearby);
}
init();
K.loop(() => {
  tick++;
  moveUsers(users);
  const r = pubsub.step(tick, interval.value, radius.value / 100);
  justPublished = new Set(r.publishers);
  second.publishes += r.publishes;
  second.delivered += r.delivered;
  second.inRange += r.inRange;
  draw();
  if (tick % 10 === 0) {
    chart.push(second.delivered, second.inRange);
    st.setAll({ pubs: second.publishes, msgs: second.delivered });
    st.set("useful", second.delivered ? Math.round((100 * second.inRange) / second.delivered) + "%" : "–");
    second = { publishes: 0, delivered: 0, inRange: 0 };
  }
}, 100);
