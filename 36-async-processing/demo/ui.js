// UI only: produces jobs, steps the worker pool, draws the queue, and shows the next cron run times.
import { WorkQueue } from "./work_queue.js";
import { WorkerPool } from "./worker_pool.js";
import { nextRuns } from "./cron.js";

K.title(
  "Async processing",
  "Workers lease jobs. Crashed workers' jobs reappear after the visibility timeout; poison jobs go to the DLQ.",
);

K.section("Queue");
const produceRate = K.slider("Jobs produced / s", 0, 20, 4, 1);
const workerCount = K.slider("Workers", 1, 12, 4, 1);
const crashPercent = K.slider("Worker crash % per second", 0, 50, 5, 1);
const poisonPercent = K.slider("Poison jobs %", 0, 20, 3, 1);
const visibility = K.slider("Visibility timeout (s)", 1, 20, 6, 1);
const maxReceives = K.slider("Max receives before DLQ", 1, 10, 3, 1);
const st = K.stats({
  queued: "Visible",
  inflight: "In flight",
  done: "Done",
  redelivered: "Redelivered",
  dlq: "DLQ",
  twice: "Processed twice",
});
const cv = K.canvas(120, () => draw());
const log = K.log(80);

const queue = new WorkQueue();
const pool = new WorkerPool(queue, Math.random);
const STEP = 0.25; // seconds per tick
let now = 0;
let owed = 0; // fractional jobs carried between ticks

K.loop(() => {
  now += STEP;
  owed += produceRate.value * STEP;
  for (; owed >= 1; owed--) queue.send({ poison: Math.random() * 100 < poisonPercent.value });
  pool.resize(workerCount.value);
  const dlqBefore = queue.deadLetters.length;
  const events = pool.step(now, STEP, {
    visibilityTimeout: visibility.value,
    maxReceives: maxReceives.value,
    crashPercentPerSecond: crashPercent.value,
  });
  for (const e of events) log.add(e.text, e.kind);
  for (const job of queue.deadLetters.slice(dlqBefore))
    log.add(`job ${job.id} received ${job.receives}x → DLQ`, "bad");
  st.setAll({
    queued: queue.visible(now).length,
    inflight: queue.inFlight(now).length,
    done: pool.done,
    redelivered: queue.redelivered,
    dlq: queue.deadLetters.length,
  });
  st.set("twice", pool.processedTwice, pool.processedTwice ? "warn" : "ok");
  draw();
}, STEP * 1000);

function draw() {
  const { ctx } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("queue", 4, 14);
  ctx.fillText("workers", 4, 64);
  ctx.fillText("DLQ", 4, 104);
  queue.jobs.slice(0, 80).forEach((job, i) => {
    ctx.fillStyle = K.color(job.invisibleUntil > now ? "c6" : job.poison ? "c4" : "c1");
    ctx.fillRect(60 + i * 10, 4, 8, 16);
  });
  pool.workers.forEach((worker, i) => {
    ctx.fillStyle = K.color(worker.job ? "ok" : "line");
    ctx.fillRect(60 + i * 40, 46, 34, 26);
    ctx.fillStyle = K.color("fg");
    if (worker.job) ctx.fillText("#" + worker.job.id, 63 + i * 40, 63);
  });
  queue.deadLetters.slice(-60).forEach((job, i) => {
    ctx.fillStyle = K.color("bad");
    ctx.fillRect(60 + i * 10, 92, 8, 16);
  });
}

K.section("Cron expression");
const expression = K.text(
  "minute hour day-of-month month day-of-week",
  "*/15 9-17 * * 1-5",
  () => showCron(),
  240,
);
const cronOut = K.code("");
function showCron() {
  try {
    const runs = nextRuns(expression.value, new Date());
    cronOut.set("next runs (local time):\n" + runs.map((d) => d.toString().slice(0, 21)).join("\n"));
  } catch (e) {
    cronOut.set("error: " + e.message);
  }
}
showCron();
