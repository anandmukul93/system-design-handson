// Geohash grid vs quadtree for "find businesses near me". Edit me and press Run.
K.title(
  "Proximity service",
  "Click the map to search. Compare the cells a geohash scans (with neighbours) with the quads a quadtree visits.",
);

const rnd = K.rng(5),
  N = 600;
const biz = Array.from({ length: N }, () => {
  const c = rnd() < 0.6;
  return { x: c ? 0.3 + (rnd() - 0.5) * 0.25 : rnd(), y: c ? 0.4 + (rnd() - 0.5) * 0.25 : rnd() };
}); // a dense "downtown"
K.section("Search");
const mode = K.select("Index", ["geohash", "quadtree"], "geohash", () => search());
const prec = K.slider("Geohash precision (bits per axis)", 1, 6, 3, 1, () => search());
const cap = K.slider("Quadtree leaf capacity", 4, 100, 20, 1, () => {
  tree = buildQT(0, 0, 1, biz);
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
let q = { x: 0.32, y: 0.42 },
  visited = [],
  scanned = 0,
  found = [];

function buildQT(x, y, s, pts, d = 0) {
  if (pts.length <= cap.value || d > 8) return { x, y, s, pts };
  const h = s / 2;
  const kids = [
    [x, y],
    [x + h, y],
    [x, y + h],
    [x + h, y + h],
  ].map(([a, b]) =>
    buildQT(
      a,
      b,
      h,
      pts.filter((p) => p.x >= a && p.x < a + h && p.y >= b && p.y < b + h),
      d + 1,
    ),
  );
  return { x, y, s, kids };
}
let tree = buildQT(0, 0, 1, biz);
function search() {
  const r = radius.value / 100;
  visited = [];
  scanned = 0;
  let cand = [];
  if (mode.value === "geohash") {
    const n = 2 ** prec.value,
      cx = Math.floor(q.x * n),
      cy = Math.floor(q.y * n);
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        // own cell + 8 neighbours
        const gx = cx + dx,
          gy = cy + dy;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        visited.push({ x: gx / n, y: gy / n, s: 1 / n });
        cand.push(...biz.filter((p) => Math.floor(p.x * n) === gx && Math.floor(p.y * n) === gy));
      }
  } else {
    (function walk(nd) {
      if (q.x + r < nd.x || q.x - r > nd.x + nd.s || q.y + r < nd.y || q.y - r > nd.y + nd.s) return; // prune
      if (nd.kids) return nd.kids.forEach(walk);
      visited.push(nd);
      cand.push(...nd.pts);
    })(tree);
  }
  scanned = cand.length;
  found = cand.filter((p) => Math.hypot(p.x - q.x, p.y - q.y) <= r);
  const truth = biz.filter((p) => Math.hypot(p.x - q.x, p.y - q.y) <= r).length;
  st.setAll({
    scanned,
    cells: visited.length,
    eff: scanned ? Math.round((100 * found.length) / scanned) + "%" : "–",
  });
  st.set("found", `${found.length} of ${truth}`, found.length < truth ? "bad" : "ok");
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const S = Math.min(width - 10, 410),
    ox = (width - S) / 2;
  ctx.strokeStyle = K.color("line");
  ctx.lineWidth = 1;
  if (mode.value === "geohash") {
    const n = 2 ** prec.value;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath();
      ctx.moveTo(ox + (i * S) / n, 5);
      ctx.lineTo(ox + (i * S) / n, 5 + S);
      ctx.moveTo(ox, 5 + (i * S) / n);
      ctx.lineTo(ox + S, 5 + (i * S) / n);
      ctx.stroke();
    }
  } else
    (function d(nd) {
      ctx.strokeRect(ox + nd.x * S, 5 + nd.y * S, nd.s * S, nd.s * S);
      nd.kids && nd.kids.forEach(d);
    })(tree);
  ctx.fillStyle = K.color("c1");
  ctx.globalAlpha = 0.15;
  for (const v of visited) ctx.fillRect(ox + v.x * S, 5 + v.y * S, v.s * S, v.s * S);
  ctx.globalAlpha = 1;
  const fs = new Set(found);
  for (const p of biz) {
    ctx.fillStyle = K.color(fs.has(p) ? "c2" : "muted");
    ctx.fillRect(ox + p.x * S - 1.5, 5 + p.y * S - 1.5, 3, 3);
  }
  ctx.strokeStyle = K.color("c2");
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox + q.x * S, 5 + q.y * S, (radius.value / 100) * S, 0, 7);
  ctx.stroke();
  cv._map = { ox, S };
}
cv.el.addEventListener("click", (e) => {
  const { ox, S } = cv._map;
  q = { x: (e.offsetX - ox) / S, y: (e.offsetY - 5) / S };
  search();
});
search();
