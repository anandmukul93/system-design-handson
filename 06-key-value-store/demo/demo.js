// Dynamo-style quorum cluster with vector clocks and hinted handoff. Edit me and press Run.
K.title("Distributed key-value store", "Five nodes, tunable N/W/R. Partition nodes and see which reads and writes succeed, and when siblings appear.");

const NODES = ["n1", "n2", "n3", "n4", "n5"];
const up = Object.fromEntries(NODES.map((n) => [n, true]));
const store = Object.fromEntries(NODES.map((n) => [n, {}]));   // key -> [{value, clock}]
const hints = [];
const h = (s) => K.hash(s) % NODES.length;
const prefList = (key, n) => Array.from({ length: n }, (_, i) => NODES[(h(key) + i) % NODES.length]);

const vcDesc = (a, b) => Object.keys(b).every((k) => (a[k] || 0) >= b[k]);
const vcStr = (c) => "{" + Object.entries(c).map(([k, v]) => k + ":" + v).join(",") + "}";

K.section("Quorum settings");
const N = K.slider("N replicas", 1, 5, 3, 1, check);
const W = K.slider("W write acks", 1, 5, 2, 1, check);
const R = K.slider("R read replies", 1, 5, 2, 1, check);
const sloppy = K.toggle("Sloppy quorum + hinted handoff", true);
const verdict = K.note("");
function check() { verdict.textContent = W.value + R.value > N.value ? `W + R = ${W.value + R.value} > N = ${N.value}: reads see the latest write (strong).` : `W + R = ${W.value + R.value} ≤ N = ${N.value}: reads may be stale (eventual).`; }
check();

K.section("Nodes (click to fail / recover)");
NODES.forEach((n) => K.button(n, (e) => { up[n] = !up[n]; e.target.className = "k-btn" + (up[n] ? "" : " danger"); e.target.textContent = n + (up[n] ? "" : " (down)"); if (up[n]) handoff(n); render(); }));

K.section("Client");
const key = K.text("Key", "cart:42", null, 120);
const val = K.text("Value", "apple", null, 120);
const coord = K.select("Coordinator (whose clock ticks)", NODES, "n1");
K.button("PUT", put, "primary");
K.button("GET", get);
const table = K.table(["Node", "Status", "Versions of key", "Hints held"]);
const log = K.log(150);

function put() {
  const k = key.value, pref = prefList(k, N.value);
  // read current versions from reachable replicas to build the new clock (read-before-write, like Dynamo's context)
  const ctxClock = {};
  for (const n of pref) if (up[n]) for (const v of store[n][k] || []) for (const [a, c] of Object.entries(v.clock)) ctxClock[a] = Math.max(ctxClock[a] || 0, c);
  const clock = { ...ctxClock, [coord.value]: (ctxClock[coord.value] || 0) + 1 };
  let acks = 0;
  const targets = [...pref];
  if (sloppy.value) for (const n of NODES) if (!pref.includes(n)) targets.push(n);
  let used = 0;
  for (const n of targets) {
    if (used >= N.value) break;
    if (!up[n]) continue;
    const intended = pref.find((p) => !up[p] && !hints.some((x) => x.holder !== n && x.for === p && x.key === k && x.clock === clock));
    if (!pref.includes(n) && intended) { hints.push({ holder: n, for: intended, key: k, value: val.value, clock }); log.add(`${n} stores a hint for ${intended}`, "warn"); }
    else write(n, k, val.value, clock);
    acks++; used++;
  }
  if (acks >= W.value) log.add(`PUT ${k}=${val.value} ${vcStr(clock)}: ${acks} acks ≥ W=${W.value} ✓`, "ok");
  else log.add(`PUT failed: only ${acks} acks < W=${W.value}`, "bad");
  render();
}
function write(n, k, value, clock) {
  const vs = (store[n][k] || []).filter((v) => !vcDesc(clock, v.clock));
  if (!vs.some((v) => vcDesc(v.clock, clock))) vs.push({ value, clock });
  store[n][k] = vs;
}
function handoff(n) {
  for (let i = hints.length - 1; i >= 0; i--) if (hints[i].for === n) { const x = hints.splice(i, 1)[0]; write(n, x.key, x.value, x.clock); log.add(`${x.holder} hands off ${x.key} to ${n}`, "ok"); }
}
function get() {
  const k = key.value, pref = prefList(k, N.value);
  const replies = pref.filter((n) => up[n]).slice(0, R.value);
  if (replies.length < R.value) { log.add(`GET failed: ${replies.length} replies < R=${R.value}`, "bad"); return; }
  let vs = [];
  for (const n of replies) for (const v of store[n][k] || []) if (!vs.some((x) => vcStr(x.clock) === vcStr(v.clock))) vs.push(v);
  vs = vs.filter((v) => !vs.some((o) => o !== v && vcDesc(o.clock, v.clock) && vcStr(o.clock) !== vcStr(v.clock)));
  if (!vs.length) log.add(`GET ${k}: not found (asked ${replies.join(",")})`, "warn");
  else if (vs.length === 1) log.add(`GET ${k} = ${vs[0].value} ${vcStr(vs[0].clock)} from ${replies.join(",")}`, "ok");
  else log.add(`GET ${k}: ${vs.length} conflicting siblings ${vs.map((v) => v.value + vcStr(v.clock)).join(" | ")}: the client must merge`, "bad");
}
function render() {
  const k = key.value, pref = prefList(k, N.value);
  table.set(NODES.map((n) => [n + (pref.includes(n) ? " ★" : ""), up[n] ? "up" : "DOWN",
    (store[n][k] || []).map((v) => v.value + vcStr(v.clock)).join(" | ") || "–", hints.filter((x) => x.holder === n).length]));
}
render();
log.add("★ marks the preference list for the key. Try: fail n1's replicas, PUT from two coordinators, recover, GET.", "muted");
