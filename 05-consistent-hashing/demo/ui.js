// UI only: draws the ring and compares the two routers through the same contract.
// Contract every router implements:  setServers(list)   owner(key) -> server name
import { ringPosition } from "./hashing.js";
import { ModuloRouter } from "./modulo_router.js";
import { HashRing } from "./hash_ring.js";
import { keysMoved, loadStats } from "./measure.js";

K.title(
  "Consistent hashing",
  "Add or remove servers and change virtual nodes: see how many keys move compared with hash % N.",
);

const KEYS = Array.from({ length: 3000 }, (_, i) => "key-" + i);
let servers = ["A", "B", "C", "D"];
const ring = new HashRing(servers, 20);
const modulo = new ModuloRouter(servers);

K.section("Cluster");
K.slider("Virtual nodes per server", 1, 200, ring.virtualNodes, 1, (v) => {
  ring.virtualNodes = v;
  ring.setServers(servers);
  refresh(false);
});
K.button("Add server", () => change([...servers, String.fromCharCode(65 + servers.length)]), "primary");
K.button("Remove a server", () => servers.length > 1 && change(servers.slice(0, -1)));
const stats = K.stats({
  moved: "Keys moved (ring)",
  modMoved: "Keys moved (hash % N)",
  sd: "Load std-dev",
  maxmin: "Max / min load",
});
const cv = K.canvas(320, () => draw());
const bars = K.bars(150);
const log = K.log(70);

const pct = (n) => ((100 * n) / KEYS.length).toFixed(0) + "%";
function change(next) {
  const moved = keysMoved(ring, KEYS, next);
  const modMoved = keysMoved(modulo, KEYS, next);
  servers = next;
  stats.set("moved", `${moved} (${pct(moved)})`, "ok");
  stats.set("modMoved", `${modMoved} (${pct(modMoved)})`, "bad");
  log.add(`${servers.length} servers: ring moved ${pct(moved)} of keys, modulo moved ${pct(modMoved)}`);
  refresh(true);
}
function refresh(keepMoved) {
  const load = loadStats(ring, KEYS, servers);
  const relative = load.stdDev / load.mean;
  stats.set(
    "sd",
    `${load.stdDev.toFixed(0)} (${(100 * relative).toFixed(0)}%)`,
    relative > 0.2 ? "bad" : "ok",
  );
  stats.set("maxmin", load.maxOverMin.toFixed(2));
  if (!keepMoved) {
    stats.set("moved", "–");
    stats.set("modMoved", "–");
  }
  bars.draw(servers.map((s, i) => ({ label: s, value: load.counts[s], color: i })));
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const cx = width / 2;
  const cy = 160;
  const r = 130;
  const angle = (pos) => pos * 2 * Math.PI - Math.PI / 2;
  ctx.strokeStyle = K.color("line");
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, 7);
  ctx.stroke();
  ctx.globalAlpha = 0.5;
  for (const k of KEYS.slice(0, 400)) {
    const a = angle(ringPosition(k));
    ctx.fillStyle = K.color(servers.indexOf(ring.owner(k)));
    ctx.fillRect(cx + Math.cos(a) * (r - 14) - 1, cy + Math.sin(a) * (r - 14) - 1, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  for (const point of ring.points) {
    const a = angle(point.pos);
    ctx.fillStyle = K.color(servers.indexOf(point.server));
    ctx.beginPath();
    ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, ring.virtualNodes > 50 ? 2.5 : 5, 0, 7);
    ctx.fill();
  }
  ctx.fillStyle = K.color("muted");
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(`${servers.length} servers x ${ring.virtualNodes} vnodes`, cx, cy);
  ctx.fillText("dots inside: keys, colored by owner", cx, cy + 16);
  ctx.textAlign = "start";
}
refresh(false);
