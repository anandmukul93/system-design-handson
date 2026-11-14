// UI only: quorum sliders, node buttons and a client; all behaviour comes from Cluster.
import { Cluster } from "./cluster.js";
import { format } from "./vector_clock.js";

K.title(
  "Distributed key-value store",
  "Five nodes, tunable N/W/R. Partition nodes and see which reads and writes succeed, and when siblings appear.",
);

const NODES = ["n1", "n2", "n3", "n4", "n5"];
const cluster = new Cluster(NODES, K.hash);

K.section("Quorum settings");
const N = K.slider("N replicas", 1, 5, 3, 1, check);
const W = K.slider("W write acks", 1, 5, 2, 1, check);
const R = K.slider("R read replies", 1, 5, 2, 1, check);
const sloppy = K.toggle("Sloppy quorum + hinted handoff", true);
const verdict = K.note("");
function check() {
  const sum = W.value + R.value;
  verdict.textContent =
    sum > N.value
      ? `W + R = ${sum} > N = ${N.value}: reads see the latest write (strong).`
      : `W + R = ${sum} ≤ N = ${N.value}: reads may be stale (eventual).`;
  render();
}

K.section("Nodes (click to fail / recover)");
NODES.forEach((n) =>
  K.button(n, (e) => {
    const nowUp = !cluster.up[n];
    for (const ev of cluster.setUp(n, nowUp)) log.add(`${ev.holder} hands off ${ev.key} to ${n}`, "ok");
    e.target.className = "k-btn" + (nowUp ? "" : " danger");
    e.target.textContent = n + (nowUp ? "" : " (down)");
    render();
  }),
);

K.section("Client");
const key = K.text("Key", "cart:42", () => render(), 120);
const val = K.text("Value", "apple", null, 120);
const coord = K.select("Coordinator (whose clock ticks)", NODES, "n1");
K.button("PUT", put, "primary");
K.button("GET", get);
const table = K.table(["Node", "Status", "Versions of key", "Hints held"]);
const log = K.log(150);

function put() {
  const res = cluster.put(key.value, val.value, {
    n: N.value,
    w: W.value,
    sloppy: sloppy.value,
    coordinator: coord.value,
  });
  for (const ev of res.events) log.add(`${ev.holder} stores a hint for ${ev.intendedFor}`, "warn");
  if (res.ok)
    log.add(`PUT ${key.value}=${val.value} ${format(res.clock)}: ${res.acks} acks ≥ W=${W.value} ✓`, "ok");
  else log.add(`PUT failed: only ${res.acks} acks < W=${W.value}`, "bad");
  render();
}
function get() {
  const res = cluster.get(key.value, { n: N.value, r: R.value });
  const from = res.replies.join(",");
  const show = (v) => v.value + format(v.clock);
  if (!res.ok) log.add(`GET failed: ${res.replies.length} replies < R=${R.value}`, "bad");
  else if (!res.versions.length) log.add(`GET ${key.value}: not found (asked ${from})`, "warn");
  else if (res.versions.length === 1)
    log.add(`GET ${key.value} = ${show(res.versions[0])} from ${from}`, "ok");
  else
    log.add(
      `GET ${key.value}: ${res.versions.length} conflicting siblings ${res.versions.map(show).join(" | ")}: the client must merge`,
      "bad",
    );
}
function render() {
  const pref = cluster.preferenceList(key.value, N.value);
  table.set(
    NODES.map((n) => [
      n + (pref.includes(n) ? " ★" : ""),
      cluster.up[n] ? "up" : "DOWN",
      (cluster.store[n][key.value] || []).map((v) => v.value + format(v.clock)).join(" | ") || "–",
      cluster.hints.filter((h) => h.holder === n).length,
    ]),
  );
}
check();
log.add(
  "★ marks the preference list for the key. Try: fail n1's replicas, PUT from two coordinators, recover, GET.",
  "muted",
);
