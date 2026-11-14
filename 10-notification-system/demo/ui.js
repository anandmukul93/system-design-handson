// UI only: provider sliders, a burst button and charts of the pipeline's queues.
import { Pipeline, CHANNELS } from "./pipeline.js";

K.title(
  "Notification system",
  "Bursts of events fan out to push, SMS and email queues. Make providers flaky and watch retries and the dead-letter queue.",
);

const random = K.rng(3);
const pipeline = new Pipeline(random);
let nextEventId = 1;

K.section("Providers");
const controls = {};
for (const c of CHANNELS) {
  controls[c] = {
    fail: K.slider(`${c} failure %`, 0, 100, c === "sms" ? 30 : 5, 1),
    latency: K.slider(`${c} latency (ticks)`, 1, 10, c === "email" ? 4 : 1, 1),
  };
}
const maxAttempts = K.slider("Max attempts", 1, 8, 4, 1);

K.section("Events");
const burst = K.slider("Events per burst", 1, 200, 40, 1);
const dupPct = K.slider("Duplicate events %", 0, 50, 15, 1);
K.button("Send burst", sendBurst, "primary");
const st = K.stats({
  in: "Events in",
  deduped: "Deduped",
  pending: "Queued / in flight",
  dlq: "Dead-letter queue",
});
const chart = K.chart(
  CHANNELS.map((c) => ({ name: c + " queue" })),
  { height: 150 },
);
const table = K.table(["Channel", "Sent", "Retries", "DLQ"]);
const log = K.log(100);

function sendBurst() {
  for (let i = 0; i < burst.value; i++) {
    // sometimes the upstream service sends an event it already sent
    const repeat = random() * 100 < dupPct.value && nextEventId > 1;
    const id = repeat ? Math.max(1, nextEventId - 1 - Math.floor(random() * 5)) : nextEventId++;
    pipeline.submit(id);
  }
  log.add(`burst of ${burst.value} events`, "muted");
}
K.loop(() => {
  const providers = Object.fromEntries(
    CHANNELS.map((c) => [c, { failPercent: controls[c].fail.value, latency: controls[c].latency.value }]),
  );
  for (const e of pipeline.step(providers, maxAttempts.value)) {
    if (e.type === "dead-letter") log.add(`${e.channel} #${e.id} failed ${e.attempts}x → DLQ`, "bad");
    else if (random() < 0.1) log.add(`${e.channel} #${e.id} failed, retry in ${e.delay} ticks`, "warn");
  }
  chart.push(...CHANNELS.map((c) => pipeline.queues[c].length));
  table.set(
    CHANNELS.map((c) => [
      c,
      pipeline.stats[c].sent,
      pipeline.stats[c].retried,
      pipeline.stats[c].deadLettered,
    ]),
  );
  st.setAll({ in: pipeline.received, deduped: pipeline.deduped, pending: pipeline.pending() });
  st.set("dlq", pipeline.deadLettered(), pipeline.deadLettered() ? "bad" : "ok");
}, 150);
sendBurst();
