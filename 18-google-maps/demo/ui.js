// UI only: a paintable grid that runs both algorithms and shows the frontier of the one you pick.
// Contract both algorithms implement:  route(map, start, goal) -> { explored, exploredCount, path, eta }
import { GridMap } from "./grid_map.js";
import { dijkstra } from "./dijkstra.js";
import { aStar } from "./a_star.js";

K.title(
  "Routing: Dijkstra vs A*",
  "Drag on the grid to draw walls (shift-drag paints traffic). Run both and compare nodes explored and ETA.",
);

const map = new GridMap(40, 24);
const START = map.index(3, 12);
const GOAL = map.index(36, 12);
const TRAFFIC_COST = 6;
let results = {};

K.section("Controls");
K.button("Run both", runBoth, "primary");
K.button("Clear walls & traffic", () => {
  map.clear();
  results = {};
  draw();
});
K.button("Random traffic jam", () => {
  const random = K.rng(Date.now());
  for (let jam = 0; jam < 6; jam++) {
    const cx = 8 + Math.floor(random() * 24);
    const cy = Math.floor(random() * map.height);
    for (let x = cx - 2; x <= cx + 2; x++)
      for (let y = cy - 2; y <= cy + 2; y++) if (map.inside(x, y)) map.cost[map.index(x, y)] = TRAFFIC_COST;
  }
  runBoth();
});
const view = K.select("Show frontier of", ["Dijkstra", "A*"], "A*", () => draw());
const st = K.stats({ dn: "Dijkstra explored", an: "A* explored", eta: "ETA (cost)", len: "Route length" });
const cv = K.canvas(map.height * 16 + 4, () => draw());

function runBoth() {
  results = { Dijkstra: dijkstra(map, START, GOAL), "A*": aStar(map, START, GOAL) };
  const a = results["A*"];
  const same = results.Dijkstra.eta === a.eta;
  st.setAll({
    dn: results.Dijkstra.exploredCount,
    an: a.exploredCount,
    eta: isFinite(a.eta) ? a.eta.toFixed(0) + (same ? " (both equal)" : "") : "no route",
    len: a.path.length,
  });
  draw();
}
const cellSize = () => Math.min(16, (cv.width - 4) / map.width);
function draw() {
  const { ctx } = cv;
  cv.clear();
  const c = cellSize();
  const shown = results[view.value];
  const onPath = new Set(shown ? shown.path : []);
  for (let i = 0; i < map.width * map.height; i++) {
    const x = 2 + (i % map.width) * c;
    const y = 2 + Math.floor(i / map.width) * c;
    const explored = shown && shown.explored[i];
    const traffic = map.cost[i] > 1;
    ctx.fillStyle = map.wall[i]
      ? K.color("fg")
      : onPath.has(i)
        ? K.color("c2")
        : explored
          ? K.color("c1")
          : traffic
            ? K.color("bad")
            : K.color("line");
    ctx.globalAlpha = map.wall[i] || onPath.has(i) ? 1 : explored ? 0.35 : traffic ? 0.4 : 0.5;
    ctx.fillRect(x, y, c - 1, c - 1);
  }
  ctx.globalAlpha = 1;
  for (const [cell, color] of [
    [START, "ok"],
    [GOAL, "c4"],
  ]) {
    ctx.fillStyle = K.color(color);
    ctx.fillRect(2 + (cell % map.width) * c, 2 + Math.floor(cell / map.width) * c, c - 1, c - 1);
  }
}

let painting = false;
function paint(e) {
  const c = cellSize();
  const x = Math.floor((e.offsetX - 2) / c);
  const y = Math.floor((e.offsetY - 2) / c);
  if (!map.inside(x, y)) return;
  if (e.shiftKey) map.cost[map.index(x, y)] = TRAFFIC_COST;
  else map.wall[map.index(x, y)] = 1;
  draw();
}
cv.el.addEventListener("mousedown", (e) => {
  painting = true;
  paint(e);
});
cv.el.addEventListener("mousemove", (e) => painting && paint(e));
addEventListener("mouseup", () => {
  if (!painting) return;
  painting = false;
  runBoth();
});
for (let y = 4; y < 20; y++) map.wall[map.index(20, y)] = 1;
runBoth();
