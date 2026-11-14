// Matching engine: price-time priority, depth ladder, candles, deterministic replay. Edit me and press Run.
K.title(
  "Stock exchange matching engine",
  "Limit orders rest in the book; crossing orders fill at the resting price, oldest first. A second engine replays the log.",
);

function engine() {
  const bids = [],
    asks = []; // each: {id, side, px, qty, seq}
  let seq = 0;
  return {
    bids,
    asks,
    submit(o, fills) {
      o.seq = ++seq;
      const book = o.side === "buy" ? asks : bids;
      const crosses = (r) => (o.side === "buy" ? r.px <= o.px : r.px >= o.px);
      while (o.qty > 0 && book.length && crosses(book[0])) {
        const r = book[0],
          q = Math.min(o.qty, r.qty);
        fills.push({
          px: r.px,
          qty: q,
          buy: o.side === "buy" ? o.id : r.id,
          sell: o.side === "sell" ? o.id : r.id,
        });
        o.qty -= q;
        r.qty -= q;
        if (!r.qty) book.shift();
      }
      if (o.qty > 0) {
        const mine = o.side === "buy" ? bids : asks;
        mine.push(o);
        mine.sort((a, b) => (o.side === "buy" ? b.px - a.px : a.px - b.px) || a.seq - b.seq); // price, then time
      }
    },
  };
}
const A = engine(),
  B = engine(),
  journal = [],
  fills = [];
let nextId = 1,
  candles = [],
  cur = null,
  tick = 0;

K.section("Order entry");
const side = K.select("Side", ["buy", "sell"], "buy");
const px = K.slider("Limit price", 90, 110, 100, 1);
const qty = K.slider("Quantity", 1, 50, 10, 1);
K.button("Submit", () => place(side.value, px.value, qty.value), "primary");
const flow = K.toggle("Random order flow", true);
K.button("Replay journal on engine B", replay);
const st = K.stats({
  last: "Last trade",
  spread: "Spread",
  orders: "Orders journaled",
  fills: "Fills",
  match: "Engine B identical",
});
const ladder = K.canvas(200, () => draw());
const cv = K.canvas(150, () => drawCandles());
const log = K.log(80);

function place(s, p, q) {
  const o = { id: nextId++, side: s, px: p, qty: q };
  journal.push({ ...o });
  const f = [];
  A.submit(o, f);
  for (const x of f) {
    fills.push(x);
    if (!cur) cur = { o: x.px, h: x.px, l: x.px, c: x.px };
    cur.h = Math.max(cur.h, x.px);
    cur.l = Math.min(cur.l, x.px);
    cur.c = x.px;
  }
  if (f.length) log.add(`#${o.id} ${s} ${q}@${p}: ${f.map((x) => `${x.qty}@${x.px}`).join(", ")}`, "ok");
  render();
}
function replay() {
  const b = engine(),
    f = [];
  for (const o of journal) b.submit({ ...o }, f);
  const key = (e) =>
    JSON.stringify([e.bids.map((o) => [o.id, o.px, o.qty]), e.asks.map((o) => [o.id, o.px, o.qty])]);
  const same = key(b) === key(A) && f.length === fills.length;
  st.set("match", same ? "yes ✓" : "NO", same ? "ok" : "bad");
  log.add(
    `engine B replayed ${journal.length} orders → ${f.length} fills, book ${same ? "identical" : "differs"}`,
    same ? "ok" : "bad",
  );
}
function levels(book) {
  const m = new Map();
  for (const o of book) m.set(o.px, (m.get(o.px) || 0) + o.qty);
  return [...m];
}
function draw() {
  const { ctx, width } = ladder;
  ladder.clear();
  ctx.font = "11px ui-monospace, monospace";
  const as = levels(A.asks).slice(0, 6).reverse(),
    bs = levels(A.bids).slice(0, 6);
  const max = Math.max(1, ...as.map((l) => l[1]), ...bs.map((l) => l[1])),
    mid = width / 2;
  as.forEach(([p, q], i) => {
    const y = 6 + (6 - as.length + i) * 15;
    ctx.fillStyle = K.color("bad");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(mid + 30, y, ((width / 2 - 40) * q) / max, 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(`${p}`, mid - 12, y + 10);
    ctx.fillText(q, mid + 34, y + 10);
  });
  bs.forEach(([p, q], i) => {
    const y = 104 + i * 15;
    ctx.fillStyle = K.color("ok");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(mid - 30 - ((width / 2 - 40) * q) / max, y, ((width / 2 - 40) * q) / max, 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(`${p}`, mid - 12, y + 10);
    ctx.fillText(q, mid - 60, y + 10);
  });
  ctx.fillStyle = K.color("muted");
  ctx.fillText("asks (sell)", mid + 30, 198);
  ctx.fillText("bids (buy)", 8, 198);
}
function drawCandles() {
  const { ctx, width } = cv;
  cv.clear();
  const all = [...candles, cur].filter(Boolean).slice(-40);
  if (!all.length) return;
  const lo = Math.min(...all.map((c) => c.l)) - 1,
    hi = Math.max(...all.map((c) => c.h)) + 1,
    y = (v) => 10 + ((hi - v) / (hi - lo)) * 130,
    w = (width - 20) / 40;
  all.forEach((c, i) => {
    const x = 10 + i * w + w / 2;
    ctx.strokeStyle = ctx.fillStyle = K.color(c.c >= c.o ? "ok" : "bad");
    ctx.beginPath();
    ctx.moveTo(x, y(c.h));
    ctx.lineTo(x, y(c.l));
    ctx.stroke();
    ctx.fillRect(x - w * 0.35, Math.min(y(c.o), y(c.c)), w * 0.7, Math.max(1, Math.abs(y(c.o) - y(c.c))));
  });
}
function render() {
  const bb = A.bids[0]?.px,
    ba = A.asks[0]?.px;
  st.setAll({
    last: fills.at(-1)?.px ?? "–",
    spread: bb && ba ? ba - bb : "–",
    orders: journal.length,
    fills: fills.length,
  });
  draw();
  drawCandles();
}
const rnd = K.rng(28);
let mid = 100;
K.loop(() => {
  tick++;
  if (flow.value) {
    mid += (rnd() - 0.5) * 0.6;
    const s = rnd() < 0.5 ? "buy" : "sell";
    place(s, Math.round(mid + (s === "buy" ? -1 : 1) * (rnd() * 4 - 1.2)), 1 + Math.floor(rnd() * 20));
  }
  if (tick % 10 === 0 && cur) {
    candles.push(cur);
    cur = { o: cur.c, h: cur.c, l: cur.c, c: cur.c };
  }
}, 200);
