// Notification pipeline: per-channel queues, retries with backoff, dedupe, DLQ. Edit me and press Run.
K.title("Notification system", "Bursts of events fan out to push, SMS and email queues. Make providers flaky and watch retries and the dead-letter queue.");

const CH = ["push", "sms", "email"];
const cfg = {}, q = {}, stats = {};
K.section("Providers");
for (const c of CH) {
  cfg[c] = { fail: K.slider(`${c} failure %`, 0, 100, c === "sms" ? 30 : 5, 1), lat: K.slider(`${c} latency (ticks)`, 1, 10, c === "email" ? 4 : 1, 1) };
  q[c] = []; stats[c] = { sent: 0, retried: 0, dlq: 0 };
}
const maxRetries = K.slider("Max attempts", 1, 8, 4, 1);
K.section("Events");
const burst = K.slider("Events per burst", 1, 200, 40, 1);
const dupPct = K.slider("Duplicate events %", 0, 50, 15, 1);
K.button("Send burst", sendBurst, "primary");
const st = K.stats({ in: "Events in", deduped: "Deduped", pending: "Queued / in flight", dlq: "Dead-letter queue" });
const chart = K.chart(CH.map((c) => ({ name: c + " queue" })), { height: 150 });
const table = K.table(["Channel", "Sent", "Retries", "DLQ"]);
const log = K.log(100);
const rnd = K.rng(3);
let tick = 0, evIn = 0, deduped = 0, nextEv = 1;
const seen = new Set();

function sendBurst() {
  for (let i = 0; i < burst.value; i++) {
    const id = rnd() * 100 < dupPct.value && nextEv > 1 ? Math.max(1, nextEv - 1 - Math.floor(rnd() * 5)) : nextEv++;
    evIn++;
    if (seen.has(id)) { deduped++; continue; }                          // idempotency key check
    seen.add(id);
    const c = CH[id % 3];
    q[c].push({ id, attempt: 1, readyAt: tick });
  }
  log.add(`burst of ${burst.value} events`, "muted");
}
function step() {
  tick++;
  for (const c of CH) {
    const ready = q[c].filter((m) => m.readyAt <= tick).slice(0, 5);    // 5 workers per channel
    for (const m of ready) {
      q[c].splice(q[c].indexOf(m), 1);
      if (rnd() * 100 >= cfg[c].fail.value) { stats[c].sent++; continue; }
      if (m.attempt >= maxRetries.value) { stats[c].dlq++; log.add(`${c} #${m.id} failed ${m.attempt}x → DLQ`, "bad"); continue; }
      const backoff = cfg[c].lat.value * 2 ** m.attempt + Math.floor(rnd() * 3);   // exponential + jitter
      stats[c].retried++;
      q[c].push({ ...m, attempt: m.attempt + 1, readyAt: tick + backoff });
      if (m.attempt === 1 && rnd() < 0.1) log.add(`${c} #${m.id} failed, retry in ${backoff} ticks`, "warn");
    }
  }
  chart.push(...CH.map((c) => q[c].length));
  table.set(CH.map((c) => [c, stats[c].sent, stats[c].retried, stats[c].dlq]));
  st.setAll({ in: evIn, deduped, pending: CH.reduce((a, c) => a + q[c].length, 0) });
  st.set("dlq", CH.reduce((a, c) => a + stats[c].dlq, 0), CH.some((c) => stats[c].dlq) ? "bad" : "ok");
}
K.loop(step, 150);
sendBurst();
