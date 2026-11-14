// UI only: order entry, a depth ladder, candles, and a button that replays the journal on a second engine.
import { MatchingEngine, replayJournal } from "./matching_engine.js";
import { CandleBuilder } from "./candles.js";

K.title(
  "Stock exchange matching engine",
  "Limit orders rest in the book; crossing orders fill at the resting price, oldest first. A second engine replays the log.",
);

const engine = new MatchingEngine();
const candles = new CandleBuilder();
const journal = []; // every accepted order, in sequence: the source of truth
let fillCount = 0;
let lastPrice = null;
let nextId = 1;

K.section("Order entry");
const side = K.select("Side", ["buy", "sell"], "buy");
const price = K.slider("Limit price", 90, 110, 100, 1);
const quantity = K.slider("Quantity", 1, 50, 10, 1);
K.button("Submit", () => place(side.value, price.value, quantity.value), "primary");
const flow = K.toggle("Random order flow", true);
K.button("Replay journal on engine B", verifyReplay);
const st = K.stats({
  last: "Last trade",
  spread: "Spread",
  orders: "Orders journaled",
  fills: "Fills",
  match: "Engine B identical",
});
const ladder = K.canvas(200, () => drawLadder());
const chart = K.canvas(150, () => drawCandles());
const log = K.log(80);

function place(orderSide, orderPrice, orderQuantity) {
  const order = { id: nextId++, side: orderSide, price: orderPrice, quantity: orderQuantity };
  journal.push(order); // journal first, then match
  const fills = engine.submit(order);
  for (const f of fills) {
    candles.addTrade(f.price);
    lastPrice = f.price;
  }
  fillCount += fills.length;
  if (fills.length) {
    const summary = fills.map((f) => `${f.quantity}@${f.price}`).join(", ");
    log.add(`#${order.id} ${orderSide} ${orderQuantity}@${orderPrice}: ${summary}`, "ok");
  }
  render();
}
function verifyReplay() {
  const b = replayJournal(journal);
  const same = b.engine.fingerprint() === engine.fingerprint() && b.fillCount === fillCount;
  st.set("match", same ? "yes ✓" : "NO", same ? "ok" : "bad");
  log.add(
    `engine B replayed ${journal.length} orders → ${b.fillCount} fills, book ${same ? "identical" : "differs"}`,
    same ? "ok" : "bad",
  );
}
function drawLadder() {
  const { ctx, width } = ladder;
  ladder.clear();
  ctx.font = "11px ui-monospace, monospace";
  const ROWS = 6;
  const asks = engine.depth("sell").slice(0, ROWS).reverse(); // worst ask on top, best next to the spread
  const bids = engine.depth("buy").slice(0, ROWS);
  const largest = Math.max(1, ...asks.map((l) => l[1]), ...bids.map((l) => l[1]));
  const middle = width / 2;
  const barWidth = (q) => ((width / 2 - 40) * q) / largest;
  asks.forEach(([p, q], i) => {
    const y = 6 + (ROWS - asks.length + i) * 15;
    ctx.fillStyle = K.color("bad");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(middle + 30, y, barWidth(q), 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(p, middle - 12, y + 10);
    ctx.fillText(q, middle + 34, y + 10);
  });
  bids.forEach(([p, q], i) => {
    const y = 104 + i * 15;
    ctx.fillStyle = K.color("ok");
    ctx.globalAlpha = 0.5;
    ctx.fillRect(middle - 30 - barWidth(q), y, barWidth(q), 12);
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(p, middle - 12, y + 10);
    ctx.fillText(q, middle - 60, y + 10);
  });
  ctx.fillStyle = K.color("muted");
  ctx.fillText("asks (sell)", middle + 30, 198);
  ctx.fillText("bids (buy)", 8, 198);
}
function drawCandles() {
  const { ctx, width } = chart;
  chart.clear();
  const SHOWN = 40;
  const list = candles.recent(SHOWN);
  if (!list.length) return;
  const low = Math.min(...list.map((c) => c.low)) - 1;
  const high = Math.max(...list.map((c) => c.high)) + 1;
  const Y = (v) => 10 + ((high - v) / (high - low)) * 130;
  const w = (width - 20) / SHOWN;
  list.forEach((c, i) => {
    const x = 10 + i * w + w / 2;
    ctx.strokeStyle = ctx.fillStyle = K.color(c.close >= c.open ? "ok" : "bad");
    ctx.beginPath();
    ctx.moveTo(x, Y(c.high));
    ctx.lineTo(x, Y(c.low));
    ctx.stroke();
    ctx.fillRect(
      x - w * 0.35,
      Math.min(Y(c.open), Y(c.close)),
      w * 0.7,
      Math.max(1, Math.abs(Y(c.open) - Y(c.close))),
    );
  });
}
function render() {
  st.setAll({
    last: lastPrice ?? "–",
    spread: engine.spread() ?? "–",
    orders: journal.length,
    fills: fillCount,
  });
  drawLadder();
  drawCandles();
}

const random = K.rng(28);
let fairPrice = 100;
let tick = 0;
K.loop(() => {
  tick++;
  if (flow.value) {
    fairPrice += (random() - 0.5) * 0.6; // a slow random walk
    const orderSide = random() < 0.5 ? "buy" : "sell";
    const offset = random() * 4 - 1.2; // mostly passive, sometimes crossing the spread
    const limit = Math.round(fairPrice + (orderSide === "buy" ? -offset : offset));
    place(orderSide, limit, 1 + Math.floor(random() * 20));
  }
  if (tick % 10 === 0) candles.roll();
}, 200);
