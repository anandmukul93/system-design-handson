// UI only: an upload button that runs the DAG, and a player with a bandwidth slider.
import { TASKS, depth, criticalPath, DagRun } from "./transcode_dag.js";
import { LADDER, Player } from "./adaptive_bitrate.js";

K.title(
  "Video upload and streaming",
  "Upload runs a DAG across workers. Then play it and drag the bandwidth: the player switches renditions.",
);

K.section("Upload");
const workers = K.slider("Workers", 1, 8, 3, 1);
K.button("Upload video", upload, "primary");
const st = K.stats({ t: "Elapsed (ticks)", busy: "Busy workers", done: "Tasks done", crit: "Critical path" });
const cv = K.canvas(210, () => draw());
K.section("Playback");
const bandwidth = K.slider("Network bandwidth (kbps)", 200, 8000, 3000, 100);
K.button("Play / pause", () => {
  playing = !playing;
});
const pst = K.stats({ rend: "Rendition", buf: "Buffer (s)", stalls: "Stalls", sw: "Switches" });
const chart = K.chart([{ name: "bandwidth kbps" }, { name: "rendition kbps" }], { height: 140 });
const log = K.log(80);

const CRITICAL = criticalPath("cdn push");
let run = new DagRun();
let player = new Player();
let playing = false;

function upload() {
  run = new DagRun();
  playing = false;
  log.add("uploaded: tasks run as soon as all their inputs are done", "muted");
}
function stepDag() {
  if (run.finished()) return;
  run.step(workers.value);
  st.setAll({
    t: run.ticks,
    busy: run.count("running"),
    done: `${run.count("done")} / ${TASKS.length}`,
    crit: CRITICAL + " ticks",
  });
  if (run.finished()) {
    playing = true;
    log.add(`ready in ${run.ticks} ticks (critical path ${CRITICAL}). Playing.`, "ok");
  }
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const columns = {};
  TASKS.forEach((t) => (columns[depth(t.id)] ??= []).push(t));
  const pos = {};
  for (const [col, tasks] of Object.entries(columns)) {
    tasks.forEach((t, i) => {
      const y = tasks.length === 1 ? 105 : 25 + (i * 180) / (tasks.length - 1);
      pos[t.id] = { x: 50 + (Number(col) * (width - 100)) / 4, y };
    });
  }
  ctx.strokeStyle = K.color("line");
  for (const t of TASKS)
    for (const dep of t.deps) {
      ctx.beginPath();
      ctx.moveTo(pos[dep].x, pos[dep].y);
      ctx.lineTo(pos[t.id].x, pos[t.id].y);
      ctx.stroke();
    }
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  const colorOf = { done: "ok", running: "warn", waiting: "muted" };
  for (const t of TASKS) {
    ctx.fillStyle = K.color(colorOf[run.state[t.id].status]);
    ctx.fillRect(pos[t.id].x - 34, pos[t.id].y - 11, 68, 22);
    ctx.fillStyle = "#fff";
    ctx.fillText(t.id, pos[t.id].x, pos[t.id].y + 4);
  }
  ctx.textAlign = "start";
}
K.loop(() => {
  stepDag();
  if (!playing) return;
  const throughput = bandwidth.value * (0.8 + Math.random() * 0.4); // the network is never perfectly steady
  const bufferBefore = player.buffer;
  const { switchedFrom } = player.step(throughput, 0.25);
  if (switchedFrom !== undefined) {
    const up = player.rendition > switchedFrom;
    log.add(
      `switch ${LADDER[switchedFrom].name} → ${LADDER[player.rendition].name} (throughput ${Math.round(throughput)} kbps, buffer ${bufferBefore.toFixed(1)} s)`,
      up ? "ok" : "warn",
    );
  }
  chart.push(throughput, LADDER[player.rendition].kbps);
  pst.setAll({
    rend: LADDER[player.rendition].name,
    buf: player.buffer.toFixed(1),
    stalls: player.stalls,
    sw: player.switches,
  });
}, 250);
upload();
