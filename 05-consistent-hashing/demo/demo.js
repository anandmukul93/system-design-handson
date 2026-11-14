// Consistent hash ring with virtual nodes. Edit me and press Run.
K.title("Consistent hashing", "Add or remove servers and change virtual nodes: see how many keys move compared with hash % N.");

const KEYS = Array.from({ length: 3000 }, (_, i) => "key-" + i);
const h = (s) => K.hash(s) / 4294967296;            // position on the ring in [0, 1)
let servers = ["A", "B", "C", "D"];
let vnodes = 20;
let ring = [];
let assign = {};

function build() {
  ring = [];
  for (const s of servers) for (let v = 0; v < vnodes; v++) ring.push({ pos: h(s + "#" + v), s });
  ring.sort((a, b) => a.pos - b.pos);
}
function owner(key) {
  const p = h(key);
  let lo = 0, hi = ring.length;
  while (lo < hi) { const m = (lo + hi) >> 1; if (ring[m].pos < p) lo = m + 1; else hi = m; }
  return ring[lo % ring.length].s;
}
function modOwner(key, list) { return list[K.hash(key) % list.length]; }

K.section("Cluster");
const vn = K.slider("Virtual nodes per server", 1, 200, vnodes, 1, (v) => { vnodes = v; refresh(false); });
K.button("Add server", () => change([...servers, String.fromCharCode(65 + servers.length)]), "primary");
K.button("Remove a server", () => servers.length > 1 && change(servers.slice(0, -1)));
const stats = K.stats({ moved: "Keys moved (ring)", modMoved: "Keys moved (hash % N)", sd: "Load std-dev", maxmin: "Max / min load" });
const cv = K.canvas(320, () => draw());
const bars = K.bars(150);
const log = K.log(70);

function change(next) {
  const before = Object.fromEntries(KEYS.map((k) => [k, owner(k)]));
  const modBefore = Object.fromEntries(KEYS.map((k) => [k, modOwner(k, servers)]));
  servers = next;
  build();
  let moved = 0, modMoved = 0;
  for (const k of KEYS) { if (owner(k) !== before[k]) moved++; if (modOwner(k, servers) !== modBefore[k]) modMoved++; }
  stats.set("moved", `${moved} (${(100 * moved / KEYS.length).toFixed(0)}%)`, "ok");
  stats.set("modMoved", `${modMoved} (${(100 * modMoved / KEYS.length).toFixed(0)}%)`, "bad");
  log.add(`${servers.length} servers: ring moved ${(100 * moved / KEYS.length).toFixed(0)}% of keys, modulo moved ${(100 * modMoved / KEYS.length).toFixed(0)}%`);
  refresh(true);
}
function refresh(keepMoved) {
  build();
  const counts = Object.fromEntries(servers.map((s) => [s, 0]));
  for (const k of KEYS) counts[owner(k)]++;
  const vals = Object.values(counts), mean = KEYS.length / servers.length;
  const sd = Math.sqrt(vals.reduce((a, v) => a + (v - mean) ** 2, 0) / vals.length);
  stats.set("sd", `${sd.toFixed(0)} (${(100 * sd / mean).toFixed(0)}%)`, sd / mean > 0.2 ? "bad" : "ok");
  stats.set("maxmin", (Math.max(...vals) / Math.max(1, Math.min(...vals))).toFixed(2));
  if (!keepMoved) { stats.set("moved", "–"); stats.set("modMoved", "–"); }
  bars.draw(servers.map((s, i) => ({ label: s, value: counts[s], color: i })));
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear();
  const cx = width / 2, cy = 160, r = 130;
  ctx.strokeStyle = K.color("line"); ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.stroke();
  for (const k of KEYS.slice(0, 400)) {
    const a = h(k) * 2 * Math.PI - Math.PI / 2, i = servers.indexOf(owner(k));
    ctx.fillStyle = K.color(i); ctx.globalAlpha = 0.5;
    ctx.fillRect(cx + Math.cos(a) * (r - 14) - 1, cy + Math.sin(a) * (r - 14) - 1, 2.5, 2.5);
  }
  ctx.globalAlpha = 1;
  for (const n of ring) {
    const a = n.pos * 2 * Math.PI - Math.PI / 2, i = servers.indexOf(n.s);
    ctx.fillStyle = K.color(i); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, vnodes > 50 ? 2.5 : 5, 0, 7); ctx.fill();
  }
  ctx.fillStyle = K.color("muted"); ctx.font = "12px system-ui"; ctx.textAlign = "center";
  ctx.fillText(`${servers.length} servers x ${vnodes} vnodes`, cx, cy); ctx.fillText("dots inside: keys, colored by owner", cx, cy + 16);
  ctx.textAlign = "start";
}
refresh(false);
