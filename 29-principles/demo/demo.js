// Principles playground: quorums under partition, tail latency at scale, Lamport clocks. Edit me and press Run.
K.title(
  "Principles simulator",
  "Three small experiments behind CAP/PACELC, tail-at-scale and logical clocks.",
);

// ---- 1. Quorums and partitions -------------------------------------------------
K.section("1. Quorums under a partition");
const N = K.slider("N replicas", 1, 7, 5, 1, q);
const W = K.slider("W", 1, 7, 3, 1, q);
const R = K.slider("R", 1, 7, 3, 1, q);
const side = K.slider("Replicas on the client's side of the partition", 0, 7, 3, 1, q);
const qs = K.stats({
  write: "Writes",
  read: "Reads",
  fresh: "Reads see latest write?",
  mode: "Behaves like",
});
function q() {
  const n = N.value,
    reach = Math.min(side.value, n),
    w = Math.min(W.value, n),
    r = Math.min(R.value, n);
  const wOk = reach >= w,
    rOk = reach >= r;
  qs.set("write", wOk ? "available" : "rejected", wOk ? "ok" : "bad");
  qs.set("read", rOk ? "available" : "rejected", rOk ? "ok" : "bad");
  qs.set("fresh", w + r > n ? "yes (W + R > N)" : "maybe stale", w + r > n ? "ok" : "warn");
  qs.set(
    "mode",
    w + r > n
      ? wOk && rOk
        ? "CP, and this side has a majority"
        : "CP: refuses rather than lies"
      : "AP: answers, may be stale",
  );
}
q();

// ---- 2. Tail latency with fan-out ---------------------------------------------
K.section("2. Tail at scale: one request fans out to many backends");
const fan = K.slider("Fan-out (backends per request)", 1, 200, 50, 1, () => tail());
const slowP = K.slider("Chance one backend is slow (%)", 0, 10, 1, 0.1, () => tail());
const hedge = K.toggle("Hedged requests (resend after p95)", false, () => tail());
const ts = K.stats({ p50: "p50", p99: "p99", hitSlow: "Requests that touch a slow backend" });
const bars = K.bars(140);
function tail() {
  const rnd = K.rng(29),
    lat = [];
  const one = () => (rnd() * 100 < slowP.value ? 200 + rnd() * 800 : 5 + rnd() * 10);
  for (let i = 0; i < 2000; i++) {
    let worst = 0;
    for (let j = 0; j < fan.value; j++) {
      let l = one();
      if (hedge.value && l > 15) l = Math.min(l, 15 + one());
      worst = Math.max(worst, l);
    }
    lat.push(worst);
  }
  lat.sort((a, b) => a - b);
  const pct = (p) => lat[Math.floor((lat.length - 1) * p)];
  const p = 1 - Math.pow(1 - slowP.value / 100, fan.value);
  ts.setAll({
    p50: pct(0.5).toFixed(0) + " ms",
    p99: pct(0.99).toFixed(0) + " ms",
    hitSlow: (100 * p).toFixed(0) + "%",
  });
  bars.draw(
    [
      ["p50", 0.5],
      ["p90", 0.9],
      ["p95", 0.95],
      ["p99", 0.99],
      ["p99.9", 0.999],
    ].map(([l, x], i) => ({ label: l, value: Math.round(pct(x)), color: i > 2 ? "bad" : "c1" })),
  );
}
tail();

// ---- 3. Wall clocks vs Lamport clocks -----------------------------------------
K.section("3. Ordering with skewed clocks");
const skew = K.slider("Node B clock skew (ms)", -100, 100, -60, 5);
K.button("A sends to B, B replies", lamport, "primary");
const table = K.table(["Event", "Real time", "Wall clock", "Lamport"]);
const note = K.note("");
function lamport() {
  const ev = [];
  let la = 0,
    lb = 0;
  const realA1 = 100,
    realB1 = 130,
    realB2 = 140,
    realA2 = 170;
  la++;
  ev.push(["A: send m1", realA1, realA1, la]);
  lb = Math.max(lb, la) + 1;
  ev.push(["B: receive m1", realB1, realB1 + skew.value, lb]);
  lb++;
  ev.push(["B: send m2", realB2, realB2 + skew.value, lb]);
  la = Math.max(la, lb) + 1;
  ev.push(["A: receive m2", realA2, realA2, la]);
  table.set(ev);
  const wallWrong = ev[1][2] < ev[0][2];
  note.textContent = wallWrong
    ? `Wall clocks say B received m1 (${ev[1][2]}) before A sent it (${ev[0][2]}). Lamport timestamps never invert cause and effect.`
    : "With this skew wall clocks happen to agree. Push the skew below −30 ms to see them invert causality.";
  note.style.color = K.color(wallWrong ? "bad" : "muted");
}
lamport();
