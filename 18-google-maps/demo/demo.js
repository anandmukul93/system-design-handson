// Dijkstra vs A* on a grid road network with walls and traffic. Edit me and press Run.
K.title("Routing: Dijkstra vs A*", "Drag on the grid to draw walls (shift-drag paints traffic). Run both and compare nodes explored and ETA.");

const W = 40, H = 24;
let wall = new Uint8Array(W * H), cost = new Float32Array(W * H).fill(1);
const start = [3, 12], goal = [36, 12];
K.section("Controls");
K.button("Run both", runBoth, "primary");
K.button("Clear walls & traffic", () => { wall.fill(0); cost.fill(1); res = {}; draw(); });
K.button("Random traffic jam", () => { const r = K.rng(Date.now()); for (let i = 0; i < 6; i++) { const cx = 8 + Math.floor(r() * 24), cy = Math.floor(r() * H); for (let x = cx - 2; x <= cx + 2; x++) for (let y = cy - 2; y <= cy + 2; y++) if (x >= 0 && y >= 0 && x < W && y < H) cost[y * W + x] = 6; } runBoth(); });
const view = K.select("Show frontier of", ["Dijkstra", "A*"], "A*", () => draw());
const st = K.stats({ dn: "Dijkstra explored", an: "A* explored", eta: "ETA (cost)", len: "Route length" });
const cv = K.canvas(H * 16 + 4, () => draw());
let res = {};

function solve(heur) {
  const dist = new Float32Array(W * H).fill(Infinity), prev = new Int32Array(W * H).fill(-1), seen = new Uint8Array(W * H);
  const s = start[1] * W + start[0], g = goal[1] * W + goal[0];
  const h = (i) => heur ? Math.abs((i % W) - goal[0]) + Math.abs(Math.floor(i / W) - goal[1]) : 0;
  dist[s] = 0; const open = [[h(s), s]]; let explored = 0;
  while (open.length) {
    let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][0] < open[bi][0]) bi = k;   // simple PQ
    const [, u] = open.splice(bi, 1)[0];
    if (seen[u]) continue; seen[u] = 1; explored++;
    if (u === g) break;
    const ux = u % W, uy = Math.floor(u / W);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const x = ux + dx, y = uy + dy; if (x < 0 || y < 0 || x >= W || y >= H) continue;
      const v = y * W + x; if (wall[v]) continue;
      const nd = dist[u] + cost[v];
      if (nd < dist[v]) { dist[v] = nd; prev[v] = u; open.push([nd + h(v), v]); }
    }
  }
  const path = []; for (let c = g; c !== -1; c = prev[c]) path.push(c);
  return { seen, explored, path: path.at(-1) === s ? path : [], eta: dist[g] };
}
function runBoth() {
  res.d = solve(false); res.a = solve(true);
  st.setAll({ dn: res.d.explored, an: res.a.explored, eta: isFinite(res.a.eta) ? res.a.eta.toFixed(0) + (res.d.eta === res.a.eta ? " (both equal)" : "") : "no route", len: res.a.path.length });
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear();
  const c = Math.min(16, (width - 4) / W), r = view.value === "A*" ? res.a : res.d, onPath = new Set(r ? r.path : []);
  for (let i = 0; i < W * H; i++) {
    const x = 2 + (i % W) * c, y = 2 + Math.floor(i / W) * c;
    ctx.fillStyle = wall[i] ? K.color("fg") : onPath.has(i) ? K.color("c2") : r && r.seen[i] ? K.color("c1") : cost[i] > 1 ? K.color("bad") : K.color("line");
    ctx.globalAlpha = wall[i] || onPath.has(i) ? 1 : r && r.seen[i] ? 0.35 : cost[i] > 1 ? 0.4 : 0.5;
    ctx.fillRect(x, y, c - 1, c - 1);
  }
  ctx.globalAlpha = 1;
  for (const [[x, y], col] of [[start, "ok"], [goal, "c4"]]) { ctx.fillStyle = K.color(col); ctx.fillRect(2 + x * c, 2 + y * c, c - 1, c - 1); }
}
let painting = false;
const paint = (e) => { const c = Math.min(16, (cv.width - 4) / W), x = Math.floor((e.offsetX - 2) / c), y = Math.floor((e.offsetY - 2) / c); if (x < 0 || y < 0 || x >= W || y >= H) return; const i = y * W + x; if (e.shiftKey) cost[i] = 6; else wall[i] = 1; draw(); };
cv.el.addEventListener("mousedown", (e) => { painting = true; paint(e); });
cv.el.addEventListener("mousemove", (e) => painting && paint(e));
window.addEventListener("mouseup", () => { if (painting) { painting = false; runBoth(); } });
for (let y = 4; y < 20; y++) wall[y * W + 20] = 1;
runBoth();
