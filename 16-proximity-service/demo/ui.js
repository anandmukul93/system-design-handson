// UI only: a clickable map that runs the same search through either index.
// Contract every index implements:  candidates(center, radius) -> { points, regions }   outlines() -> squares
import { GridIndex } from "./geohash_index.js";
import { QuadtreeIndex } from "./quadtree_index.js";
import { searchNearby } from "./search.js";

K.title(
  "Proximity service",
  "Click the map to search. Compare the cells a geohash scans (with neighbours) with the quads a quadtree visits.",
);

const random = K.rng(5);
const businesses = Array.from({ length: 600 }, () => {
  const downtown = random() < 0.6; // most businesses cluster in one dense area
  return {
    x: downtown ? 0.3 + (random() - 0.5) * 0.25 : random(),
    y: downtown ? 0.4 + (random() - 0.5) * 0.25 : random(),
  };
});
const grid = new GridIndex(businesses, 3);
const quadtree = new QuadtreeIndex(businesses, 20);
const currentIndex = () => (mode.value === "geohash" ? grid : quadtree);

K.section("Search");
const mode = K.select("Index", ["geohash", "quadtree"], "geohash", () => search());
K.slider("Geohash precision (bits per axis)", 1, 6, 3, 1, (v) => {
  grid.setPrecision(v);
  search();
});
K.slider("Quadtree leaf capacity", 4, 100, 20, 1, (v) => {
  quadtree.setCapacity(v);
  search();
});
const radius = K.slider("Radius (% of map)", 2, 30, 8, 1, () => search());
const st = K.stats({
  scanned: "Businesses scanned",
  found: "Within radius",
  cells: "Cells / quads visited",
  eff: "Precision of scan",
});
const cv = K.canvas(420, () => draw());

let center = { x: 0.32, y: 0.42 };
let result = { scanned: 0, found: [], regions: [], truth: 0 };
let map = { left: 0, size: 400 };

function search() {
  result = searchNearby(currentIndex(), businesses, center, radius.value / 100);
  st.setAll({
    scanned: result.scanned,
    cells: result.regions.length,
    eff: result.scanned ? Math.round((100 * result.found.length) / result.scanned) + "%" : "–",
  });
  const missed = result.found.length < result.truth;
  st.set("found", `${result.found.length} of ${result.truth}`, missed ? "bad" : "ok");
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  map = { left: (width - Math.min(width - 10, 410)) / 2, size: Math.min(width - 10, 410) };
  const X = (x) => map.left + x * map.size;
  const Y = (y) => 5 + y * map.size;
  ctx.strokeStyle = K.color("line");
  ctx.lineWidth = 1;
  for (const cell of currentIndex().outlines())
    ctx.strokeRect(X(cell.x), Y(cell.y), cell.size * map.size, cell.size * map.size);
  ctx.fillStyle = K.color("c1");
  ctx.globalAlpha = 0.15;
  for (const r of result.regions) ctx.fillRect(X(r.x), Y(r.y), r.size * map.size, r.size * map.size);
  ctx.globalAlpha = 1;
  const found = new Set(result.found);
  for (const p of businesses) {
    ctx.fillStyle = K.color(found.has(p) ? "c2" : "muted");
    ctx.fillRect(X(p.x) - 1.5, Y(p.y) - 1.5, 3, 3);
  }
  ctx.strokeStyle = K.color("c2");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(X(center.x), Y(center.y), (radius.value / 100) * map.size, 0, 7);
  ctx.stroke();
}
cv.el.addEventListener("click", (e) => {
  center = { x: (e.offsetX - map.left) / map.size, y: (e.offsetY - 5) / map.size };
  search();
});
search();
