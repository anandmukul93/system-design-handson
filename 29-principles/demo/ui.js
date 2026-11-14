// UI only: three small panels, one per principle.
import { quorumOutcome } from "./quorum.js";
import { plainRequest, hedgedRequest, makeBackend, measure, chanceOfSlow } from "./tail_latency.js";
import { messageExchange } from "./clocks.js";

K.title(
  "Principles simulator",
  "Three small experiments behind CAP/PACELC, tail-at-scale and logical clocks.",
);

// ---- 1. quorums ----
K.section("1. Quorums under a partition");
const N = K.slider("N replicas", 1, 7, 5, 1, showQuorum);
const W = K.slider("W", 1, 7, 3, 1, showQuorum);
const R = K.slider("R", 1, 7, 3, 1, showQuorum);
const side = K.slider("Replicas on the client's side of the partition", 0, 7, 3, 1, showQuorum);
const qs = K.stats({
  write: "Writes",
  read: "Reads",
  fresh: "Reads see latest write?",
  mode: "Behaves like",
});
function showQuorum() {
  const o = quorumOutcome({ n: N.value, w: W.value, r: R.value, reachable: side.value });
  qs.set("write", o.canWrite ? "available" : "rejected", o.canWrite ? "ok" : "bad");
  qs.set("read", o.canRead ? "available" : "rejected", o.canRead ? "ok" : "bad");
  qs.set("fresh", o.overlap ? "yes (W + R > N)" : "maybe stale", o.overlap ? "ok" : "warn");
  qs.set("mode", o.behaviour);
}
showQuorum();

// ---- 2. tail latency ----
K.section("2. Tail at scale: one request fans out to many backends");
const fan = K.slider("Fan-out (backends per request)", 1, 200, 50, 1, () => showTail());
const slowPct = K.slider("Chance one backend is slow (%)", 0, 10, 1, 0.1, () => showTail());
const hedge = K.toggle("Hedged requests (resend after p95)", false, () => showTail());
const ts = K.stats({ p50: "p50", p99: "p99", hitSlow: "Requests that touch a slow backend" });
const bars = K.bars(140);
function showTail() {
  const backend = makeBackend(slowPct.value, K.rng(29));
  const percentile = measure(hedge.value ? hedgedRequest : plainRequest, fan.value, backend);
  ts.setAll({
    p50: percentile(0.5).toFixed(0) + " ms",
    p99: percentile(0.99).toFixed(0) + " ms",
    hitSlow: (100 * chanceOfSlow(slowPct.value, fan.value)).toFixed(0) + "%",
  });
  const points = [
    ["p50", 0.5],
    ["p90", 0.9],
    ["p95", 0.95],
    ["p99", 0.99],
    ["p99.9", 0.999],
  ];
  bars.draw(
    points.map(([name, p], i) => ({
      label: name,
      value: Math.round(percentile(p)),
      color: i > 2 ? "bad" : "c1",
    })),
  );
}
showTail();

// ---- 3. clocks ----
K.section("3. Ordering with skewed clocks");
const skew = K.slider("Node B clock skew (ms)", -100, 100, -60, 5);
K.button("A sends to B, B replies", showClocks, "primary");
const table = K.table(["Event", "Real time", "Wall clock", "Lamport"]);
const note = K.note("");
function showClocks() {
  const { events, wallClockInverted } = messageExchange(skew.value);
  table.set(events.map((e) => [e.what, e.real, e.wall, e.lamport]));
  note.textContent = wallClockInverted
    ? `Wall clocks say B received m1 (${events[1].wall}) before A sent it (${events[0].wall}). Lamport timestamps never invert cause and effect.`
    : "With this skew wall clocks happen to agree. Push the skew below −30 ms to see them invert causality.";
  note.style.color = K.color(wallClockInverted ? "bad" : "muted");
}
showClocks();
