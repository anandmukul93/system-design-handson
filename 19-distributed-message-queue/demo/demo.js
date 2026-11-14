// Partitioned log with consumer groups, offsets, rebalancing and leader failover. Edit me and press Run.
K.title("Distributed message queue", "Producers append to partitions; a consumer group splits partitions and commits offsets. Remove a consumer or kill a broker.");

const P = 4, BROKERS = ["b1", "b2", "b3"];
const parts = Array.from({ length: P }, (_, i) => ({ log: [], replicas: [BROKERS[i % 3], BROKERS[(i + 1) % 3], BROKERS[(i + 2) % 3]], leader: BROKERS[i % 3], committed: 0, isr: null }));
parts.forEach((p) => (p.isr = [...p.replicas]));
const brokerUp = Object.fromEntries(BROKERS.map((b) => [b, true]));
let consumers = ["c1", "c2", "c3"], assign = {}, seq = 0, consumed = 0, redelivered = 0;

K.section("Controls");
const rate = K.slider("Produce rate (msg / tick)", 0, 10, 3, 1);
const keyed = K.toggle("Key by user id (ordering per key)", true);
const crate = K.slider("Consume per consumer / tick", 0, 10, 3, 1);
K.button("Add consumer", () => { consumers.push("c" + (consumers.length + 1)); rebalance(); });
K.button("Remove a consumer", () => { if (consumers.length > 1) { const c = consumers.pop(); log.add(`${c} left the group`, "warn"); rebalance(); } });
for (const b of BROKERS) K.button(`kill ${b}`, (e) => { brokerUp[b] = !brokerUp[b]; e.target.textContent = `${brokerUp[b] ? "kill" : "restart"} ${b}`; failover(b); }, "danger");
const st = K.stats({ produced: "Produced", consumed: "Consumed", lag: "Total lag", redeliv: "Re-delivered after rebalance" });
const cv = K.canvas(P * 46 + 10, () => draw());
const log = K.log(100);

function rebalance() {
  assign = {}; parts.forEach((p, i) => (assign[i] = consumers[i % consumers.length]));     // range-ish assignment
  // uncommitted-but-read messages will be read again by the new owner (at-least-once)
  parts.forEach((p) => { if (p.read > p.committed) { redelivered += p.read - p.committed; p.read = p.committed; } });
  log.add(`rebalance: ${parts.map((_, i) => `p${i}→${assign[i]}`).join(", ")}`, "ok");
}
function failover(b) {
  parts.forEach((p, i) => {
    p.isr = p.replicas.filter((r) => brokerUp[r]);
    if (p.leader === b && !brokerUp[b]) {
      if (p.isr.length) { p.leader = p.isr[0]; log.add(`p${i}: leader ${b} down, ${p.leader} (in-sync) elected leader`, "warn"); }
      else { p.leader = null; log.add(`p${i}: no in-sync replica, partition offline`, "bad"); }
    }
    if (!p.leader && p.isr.length) { p.leader = p.isr[0]; log.add(`p${i} back online with leader ${p.leader}`, "ok"); }
  });
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear(); ctx.font = "11px system-ui";
  parts.forEach((p, i) => {
    const y = 8 + i * 46, x0 = 130, cell = 9, show = Math.floor((width - x0 - 10) / cell), start = Math.max(0, p.log.length - show);
    ctx.fillStyle = K.color("fg"); ctx.fillText(`p${i}  leader ${p.leader || "NONE"}`, 4, y + 12);
    ctx.fillStyle = K.color("muted"); ctx.fillText(`→ ${assign[i] || "-"}  isr ${p.isr.join(",")}`, 4, y + 28);
    for (let o = start; o < p.log.length; o++) {
      ctx.fillStyle = K.color(o < p.committed ? "c3" : o < (p.read || 0) ? "c6" : K.hash(p.log[o]) % 6);
      ctx.globalAlpha = o < p.committed ? 0.35 : 0.9; ctx.fillRect(x0 + (o - start) * cell, y, cell - 1, 30);
    }
    ctx.globalAlpha = 1;
  });
  const lag = parts.reduce((a, p) => a + p.log.length - p.committed, 0);
  st.setAll({ produced: seq, consumed, redeliv: redelivered }); st.set("lag", lag, lag > 100 ? "bad" : null);
}
parts.forEach((p) => (p.read = 0));
rebalance();
K.loop(() => {
  for (let k = 0; k < rate.value; k++) {
    const user = Math.floor(Math.random() * 20), i = keyed.value ? user % P : seq % P, p = parts[i];
    if (!p.leader) continue;                         // producer gets an error: partition offline
    p.log.push("u" + user); seq++;
  }
  for (const c of consumers) parts.forEach((p, i) => {
    if (assign[i] !== c || !p.leader) return;
    const n = Math.min(crate.value, p.log.length - p.read); p.read += n; consumed += n;
    if (Math.random() < 0.5) p.committed = p.read;           // commit offsets periodically
  });
  draw();
}, 300);
