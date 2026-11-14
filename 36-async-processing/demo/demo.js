// Work queue with visibility timeouts and a DLQ, plus a cron expression evaluator. Edit me and press Run.
K.title("Async processing", "Workers lease jobs. Crashed workers' jobs reappear after the visibility timeout; poison jobs go to the DLQ.");

K.section("Queue");
const prodRate = K.slider("Jobs produced / s", 0, 20, 4, 1);
const nWorkers = K.slider("Workers", 1, 12, 4, 1);
const crashP = K.slider("Worker crash % per job", 0, 50, 10, 1);
const poisonP = K.slider("Poison jobs %", 0, 20, 3, 1);
const vis = K.slider("Visibility timeout (s)", 1, 20, 6, 1);
const maxRecv = K.slider("Max receives before DLQ", 1, 10, 3, 1);
const st = K.stats({ queued: "Visible", inflight: "In flight", done: "Done", redeliv: "Redelivered", dlq: "DLQ", dup: "Processed twice" });
const cv = K.canvas(120, () => draw());
const log = K.log(80);
let t = 0, id = 0, done = 0, redeliv = 0, dupes = 0;
const q = [], dlq = [], workers = [], processed = new Set();
K.loop(() => {
  t += 0.25;
  for (let i = 0; i < prodRate.value / 4; i++) if (Math.random() < prodRate.value / 4 - i) q.push({ id: ++id, recv: 0, poison: Math.random() * 100 < poisonP.value, invisibleUntil: 0 });
  while (workers.length < nWorkers.value) workers.push({ job: null, left: 0 });
  workers.length = nWorkers.value;
  for (const w of workers) {
    if (!w.job) {
      const j = q.find((x) => x.invisibleUntil <= t);
      if (j) { j.recv++; j.invisibleUntil = t + vis.value; w.job = j; w.left = 1 + Math.random() * 3; }
      continue;
    }
    w.left -= 0.25;
    if (w.job.poison && w.left <= 0) { log.add(`job ${w.job.id} threw (poison), receive ${w.job.recv}`, "warn"); w.job = null; continue; }   // not deleted → reappears
    if (Math.random() * 100 < crashP.value / 8) { log.add(`worker crashed holding job ${w.job.id}`, "bad"); w.job = null; continue; }
    if (w.left <= 0) {
      if (processed.has(w.job.id)) dupes++;              // lease expired mid-job and another worker also ran it
      processed.add(w.job.id); done++;
      const k = q.indexOf(w.job); if (k >= 0) q.splice(k, 1);   // ack = delete
      w.job = null;
    }
  }
  for (const j of [...q]) {
    if (j.invisibleUntil > 0 && j.invisibleUntil <= t && !workers.some((w) => w.job === j)) {
      if (j.recv >= maxRecv.value) { q.splice(q.indexOf(j), 1); dlq.push(j); log.add(`job ${j.id} received ${j.recv}x → DLQ`, "bad"); }
      else if (!j.counted || j.counted < j.recv) { j.counted = j.recv; redeliv++; }
    }
  }
  st.setAll({ queued: q.filter((j) => j.invisibleUntil <= t).length, inflight: q.filter((j) => j.invisibleUntil > t).length, done, redeliv, dlq: dlq.length });
  st.set("dup", dupes, dupes ? "warn" : "ok");
  draw();
}, 250);
function draw() {
  const { ctx, width } = cv; cv.clear(); ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted"); ctx.fillText("queue", 4, 14); ctx.fillText("workers", 4, 64); ctx.fillText("DLQ", 4, 104);
  q.slice(0, 80).forEach((j, i) => { ctx.fillStyle = K.color(j.invisibleUntil > t ? "c6" : j.poison ? "c4" : "c1"); ctx.fillRect(60 + i * 10, 4, 8, 16); });
  workers.forEach((w, i) => { ctx.fillStyle = K.color(w.job ? "ok" : "line"); ctx.fillRect(60 + i * 40, 46, 34, 26); ctx.fillStyle = K.color("fg"); if (w.job) ctx.fillText("#" + w.job.id, 63 + i * 40, 63); });
  dlq.slice(-60).forEach((j, i) => { ctx.fillStyle = K.color("bad"); ctx.fillRect(60 + i * 10, 92, 8, 16); });
}

K.section("Cron expression");
const expr = K.text("minute hour day-of-month month day-of-week", "*/15 9-17 * * 1-5", () => cron(), 240);
const out = K.code("");
function field(s, lo, hi) {
  const set = new Set();
  for (const part of s.split(",")) {
    let [range, step] = part.split("/"); step = Number(step || 1);
    let [a, b] = range === "*" ? [lo, hi] : range.split("-").map(Number); if (b === undefined) b = step > 1 ? hi : a;
    if ([a, b, step].some((x) => Number.isNaN(x))) throw new Error("bad field: " + part);
    for (let v = a; v <= b; v += step) set.add(v);
  }
  return set;
}
function cron() {
  try {
    const f = expr.value.trim().split(/\s+/); if (f.length !== 5) throw new Error("need 5 fields");
    const [mi, ho, dom, mo, dow] = [field(f[0], 0, 59), field(f[1], 0, 23), field(f[2], 1, 31), field(f[3], 1, 12), field(f[4], 0, 6)];
    const d = new Date(); d.setSeconds(0, 0); const runs = [];
    for (let i = 0; i < 60 * 24 * 366 && runs.length < 10; i++) {
      d.setMinutes(d.getMinutes() + 1);
      if (mi.has(d.getMinutes()) && ho.has(d.getHours()) && dom.has(d.getDate()) && mo.has(d.getMonth() + 1) && dow.has(d.getDay())) runs.push(d.toString().slice(0, 21));
    }
    out.set("next runs (local time):\n" + runs.join("\n"));
  } catch (e) { out.set("error: " + e.message); }
}
cron();
