// Five rate limiters side by side, fed by the same traffic. Edit me and press Run.
K.title("Rate limiting algorithms", "Same traffic, five algorithms. Watch the fixed window let a burst through at the boundary.");

const LIMIT = 10, WINDOW = 10; // 10 requests per 10 simulated seconds
let now = 0;

const algos = {
  "Token bucket": (() => { let tokens = LIMIT, last = 0; return { allow() { tokens = Math.min(LIMIT, tokens + (now - last) * LIMIT / WINDOW); last = now; if (tokens >= 1) { tokens--; return true; } return false; }, state: () => `tokens ${tokens.toFixed(1)}` }; })(),
  "Leaking bucket": (() => { let level = 0, last = 0; return { allow() { level = Math.max(0, level - (now - last) * LIMIT / WINDOW); last = now; if (level + 1 <= LIMIT) { level++; return true; } return false; }, state: () => `queue ${level.toFixed(1)}` }; })(),
  "Fixed window": (() => { let win = 0, count = 0; return { allow() { const w = Math.floor(now / WINDOW); if (w !== win) { win = w; count = 0; } if (count < LIMIT) { count++; return true; } return false; }, state: () => `count ${count}` }; })(),
  "Sliding log": (() => { const log = []; return { allow() { while (log.length && log[0] <= now - WINDOW) log.shift(); if (log.length < LIMIT) { log.push(now); return true; } return false; }, state: () => `log ${log.length}` }; })(),
  "Sliding counter": (() => { const c = {}; return { allow() { const w = Math.floor(now / WINDOW), frac = (now % WINDOW) / WINDOW; const est = (c[w] || 0) + (c[w - 1] || 0) * (1 - frac); if (est + 1 <= LIMIT) { c[w] = (c[w] || 0) + 1; return true; } return false; }, state: () => { const w = Math.floor(now / WINDOW); return `cur ${c[w] || 0} prev ${c[w - 1] || 0}`; } }; })(),
};
const names = Object.keys(algos);
const totals = Object.fromEntries(names.map((n) => [n, { ok: 0, no: 0 }]));

K.section("Traffic");
const rate = K.slider("Requests per second", 0, 5, 1.5, 0.1);
const speed = K.slider("Simulation speed", 1, 10, 4);
K.button("Burst of 15 now", () => { for (let i = 0; i < 15; i++) hit(); });
K.button("Burst at the window edge", () => { now = Math.ceil(now / WINDOW) * WINDOW - 0.2; for (let i = 0; i < 10; i++) hit(); now += 0.4; for (let i = 0; i < 10; i++) hit(); });
const pause = K.button("Pause", () => { loop.toggle(); pause.textContent = loop.running ? "Pause" : "Resume"; });
K.note(`Limit: ${LIMIT} requests per ${WINDOW} s (simulated time).`);

K.section("Results");
const table = K.table(["Algorithm", "Allowed", "Rejected", "State"]);
const chart = K.chart(names.map((n) => ({ name: n })), { height: 200, points: 150 });
K.note("Chart: requests allowed per simulated second, per algorithm.");
const log = K.log(110);

let perTick = Object.fromEntries(names.map((n) => [n, 0]));
function hit() {
  const res = names.map((n) => { const ok = algos[n].allow(); totals[n][ok ? "ok" : "no"]++; if (ok) perTick[n]++; return ok ? "✓" : "✗"; });
  log.add(`t=${now.toFixed(1)}s  ${names.map((n, i) => n.split(" ")[0] + " " + res[i]).join("  ")}`, "muted");
}

let acc = 0, lastSec = 0;
const loop = K.loop(() => {
  const dt = 0.05 * speed.value;
  now += dt;
  acc += rate.value * dt;
  while (acc >= 1) { acc--; hit(); }
  if (Math.floor(now) !== lastSec) {
    lastSec = Math.floor(now);
    chart.push(...names.map((n) => perTick[n]));
    perTick = Object.fromEntries(names.map((n) => [n, 0]));
  }
  table.set(names.map((n) => [n, totals[n].ok, totals[n].no, algos[n].state()]));
}, 50);
