// UI only: feeds the same traffic to every limiter and draws the results.
// Contract every limiter implements:  new Limiter(limit, windowSeconds)
//   allow(now: seconds) -> boolean     describe() -> string (internal state, for display)
// To add a variant: create a file exporting a class with that contract and add it to LIMITERS below.
import { TokenBucket } from "./token_bucket.js";
import { LeakingBucket } from "./leaking_bucket.js";
import { FixedWindow } from "./fixed_window.js";
import { SlidingLog } from "./sliding_log.js";
import { SlidingCounter } from "./sliding_counter.js";

const LIMIT = 10;
const WINDOW = 10; // 10 requests per 10 simulated seconds
const LIMITERS = {
  "Token bucket": new TokenBucket(LIMIT, WINDOW),
  "Leaking bucket": new LeakingBucket(LIMIT, WINDOW),
  "Fixed window": new FixedWindow(LIMIT, WINDOW),
  "Sliding log": new SlidingLog(LIMIT, WINDOW),
  "Sliding counter": new SlidingCounter(LIMIT, WINDOW),
};
const names = Object.keys(LIMITERS);
const totals = Object.fromEntries(names.map((n) => [n, { ok: 0, no: 0 }]));
let now = 0;

K.title(
  "Rate limiting algorithms",
  "Same traffic, five algorithms. Watch the fixed window let a burst through at the boundary.",
);
K.section("Traffic");
const rate = K.slider("Requests per second", 0, 5, 1.5, 0.1);
const speed = K.slider("Simulation speed", 1, 10, 4);
K.button("Burst of 15 now", () => {
  for (let i = 0; i < 15; i++) hit();
});
K.button("Burst at the window edge", () => {
  now = Math.ceil(now / WINDOW) * WINDOW - 0.2;
  for (let i = 0; i < 10; i++) hit();
  now += 0.4;
  for (let i = 0; i < 10; i++) hit();
});
const pause = K.button("Pause", () => {
  loop.toggle();
  pause.textContent = loop.running ? "Pause" : "Resume";
});
K.note(`Limit: ${LIMIT} requests per ${WINDOW} s (simulated time).`);

K.section("Results");
const table = K.table(["Algorithm", "Allowed", "Rejected", "State"]);
const chart = K.chart(
  names.map((n) => ({ name: n })),
  { height: 200, points: 150 },
);
K.note("Chart: requests allowed per simulated second, per algorithm.");
const log = K.log(110);

let perTick = Object.fromEntries(names.map((n) => [n, 0]));
function hit() {
  const marks = names.map((n) => {
    const ok = LIMITERS[n].allow(now);
    totals[n][ok ? "ok" : "no"]++;
    if (ok) perTick[n]++;
    return ok ? "✓" : "✗";
  });
  log.add(`t=${now.toFixed(1)}s  ${names.map((n, i) => n.split(" ")[0] + " " + marks[i]).join("  ")}`, "muted");
}

let acc = 0;
let lastSec = 0;
const loop = K.loop(() => {
  const dt = 0.05 * speed.value;
  now += dt;
  acc += rate.value * dt;
  while (acc >= 1) {
    acc--;
    hit();
  }
  if (Math.floor(now) !== lastSec) {
    lastSec = Math.floor(now);
    chart.push(...names.map((n) => perTick[n]));
    perTick = Object.fromEntries(names.map((n) => [n, 0]));
  }
  table.set(names.map((n) => [n, totals[n].ok, totals[n].no, LIMITERS[n].describe()]));
}, 50);
