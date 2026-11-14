// Video pipeline: transcoding DAG on a worker pool, then adaptive bitrate playback. Edit me and press Run.
K.title("Video upload and streaming", "Upload runs a DAG across workers. Then play it and drag the bandwidth: the player switches renditions.");

const DAG = [
  { id: "split", deps: [], cost: 3 },
  { id: "inspect", deps: ["split"], cost: 2 },
  { id: "audio", deps: ["split"], cost: 4 },
  { id: "thumbs", deps: ["split"], cost: 3 },
  { id: "240p", deps: ["inspect"], cost: 4 }, { id: "480p", deps: ["inspect"], cost: 6 },
  { id: "720p", deps: ["inspect"], cost: 9 }, { id: "1080p", deps: ["inspect"], cost: 14 },
  { id: "package", deps: ["audio", "240p", "480p", "720p", "1080p"], cost: 3 },
  { id: "cdn push", deps: ["package", "thumbs"], cost: 2 },
];
const LADDER = [{ r: "240p", kbps: 400 }, { r: "480p", kbps: 1200 }, { r: "720p", kbps: 2800 }, { r: "1080p", kbps: 5000 }];

K.section("Upload");
const workers = K.slider("Workers", 1, 8, 3, 1);
K.button("Upload video", upload, "primary");
const st = K.stats({ t: "Elapsed (ticks)", busy: "Busy workers", done: "Tasks done", crit: "Critical path" });
const cv = K.canvas(210, () => draw());
K.section("Playback");
const bw = K.slider("Network bandwidth (kbps)", 200, 8000, 3000, 100);
K.button("Play / pause", () => { playing = !playing; });
const pst = K.stats({ rend: "Rendition", buf: "Buffer (s)", stalls: "Stalls", sw: "Switches" });
const chart = K.chart([{ name: "bandwidth kbps" }, { name: "rendition kbps" }], { height: 140 });
const log = K.log(80);

let state = {}, t = 0, running = false, playing = false, buffer = 0, cur = 0, stalls = 0, switches = 0;
const crit = (id) => { const n = DAG.find((d) => d.id === id); return n.cost + Math.max(0, ...n.deps.map(crit)); };
function upload() { state = Object.fromEntries(DAG.map((d) => [d.id, { s: "wait", left: d.cost }])); t = 0; running = true; playing = false; log.add("uploaded: tasks run as soon as all their inputs are done", "muted"); }
function stepDag() {
  if (!running) return;
  t++;
  const ready = DAG.filter((d) => state[d.id].s === "wait" && d.deps.every((x) => state[x].s === "done"));
  let busy = DAG.filter((d) => state[d.id].s === "run").length;
  for (const d of ready) if (busy < workers.value) { state[d.id].s = "run"; busy++; }
  for (const d of DAG) if (state[d.id].s === "run" && --state[d.id].left <= 0) { state[d.id].s = "done"; }
  const done = DAG.filter((d) => state[d.id].s === "done").length;
  st.setAll({ t, busy, done: `${done} / ${DAG.length}`, crit: crit("cdn push") + " ticks" });
  if (done === DAG.length) { running = false; playing = true; log.add(`ready in ${t} ticks (critical path ${crit("cdn push")}). Playing.`, "ok"); }
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear();
  const depth = (id) => { const n = DAG.find((d) => d.id === id); return n.deps.length ? 1 + Math.max(...n.deps.map(depth)) : 0; };
  const cols = {}; DAG.forEach((d) => (cols[depth(d.id)] ??= []).push(d));
  const pos = {};
  Object.entries(cols).forEach(([c, ds]) => ds.forEach((d, i) => (pos[d.id] = { x: 50 + (Number(c) * (width - 100)) / 4, y: 25 + (i * 180) / Math.max(1, ds.length - 1 || 1) + (ds.length === 1 ? 80 : 0) })));
  ctx.strokeStyle = K.color("line");
  for (const d of DAG) for (const x of d.deps) { ctx.beginPath(); ctx.moveTo(pos[x].x, pos[x].y); ctx.lineTo(pos[d.id].x, pos[d.id].y); ctx.stroke(); }
  ctx.font = "11px system-ui"; ctx.textAlign = "center";
  for (const d of DAG) {
    const s = state[d.id]?.s || "wait";
    ctx.fillStyle = K.color(s === "done" ? "ok" : s === "run" ? "warn" : "muted");
    ctx.fillRect(pos[d.id].x - 34, pos[d.id].y - 11, 68, 22);
    ctx.fillStyle = "#fff"; ctx.fillText(d.id, pos[d.id].x, pos[d.id].y + 4);
  }
  ctx.textAlign = "start";
}
K.loop(() => {
  stepDag();
  if (!playing) return;
  const net = bw.value * (0.8 + Math.random() * 0.4);
  // ABR: pick highest rendition below 80% of measured throughput, drop fast if buffer is low
  let want = LADDER.reduce((a, l, i) => (l.kbps < net * 0.8 ? i : a), 0);
  if (buffer < 2) want = Math.min(want, cur);
  if (want !== cur) { switches++; log.add(`switch ${LADDER[cur].r} → ${LADDER[want].r} (throughput ${Math.round(net)} kbps, buffer ${buffer.toFixed(1)} s)`, want > cur ? "ok" : "warn"); cur = want; }
  buffer += net / LADDER[cur].kbps * 0.25 - 0.25;           // download rate vs playback rate per 250 ms
  if (buffer < 0) { buffer = 0; stalls++; }
  buffer = Math.min(buffer, 30);
  chart.push(net, LADDER[cur].kbps);
  pst.setAll({ rend: LADDER[cur].r, buf: buffer.toFixed(1), stalls, sw: switches });
}, 250);
upload();
