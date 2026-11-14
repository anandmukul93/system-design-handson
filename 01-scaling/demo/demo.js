// Grow an architecture step by step and watch latency and load. Edit me and press Run.
K.title("From one server to millions of users", "Turn components on, raise traffic, and kill things to see what each layer buys you.");

const S = { lb: false, servers: 1, replica: false, cache: false, cdn: false, sessions: "memory" };
const CAP = { server: 400, db: 600, replica: 600 };   // requests per second each can handle comfortably

K.section("Architecture");
K.toggle("Load balancer", S.lb, (v) => (S.lb = v));
const servers = K.slider("Web servers", 1, 8, 1, 1, (v) => (S.servers = v));
K.toggle("Read replica", S.replica, (v) => (S.replica = v));
K.toggle("Redis cache", S.cache, (v) => (S.cache = v));
K.toggle("CDN for static files", S.cdn, (v) => (S.cdn = v));
K.select("Sessions stored in", ["memory", "redis"], S.sessions, (v) => (S.sessions = v));

K.section("Traffic and failures");
const rps = K.slider("Requests per second", 50, 5000, 300, 50);
const readPct = K.slider("Read share %", 50, 99, 90);
let dead = 0, dbDown = false, loggedOut = 0;
K.button("Kill a web server", () => { if (S.servers - dead > 0) { dead++; if (S.sessions === "memory") loggedOut += Math.round(100 / Math.max(1, S.servers)); log.add("A web server died" + (S.sessions === "memory" ? ": its users lost their sessions" : ""), "bad"); } }, "danger");
K.button("Kill primary DB", () => { dbDown = true; log.add("Primary DB down: writes fail" + (S.replica ? ", reads still served by the replica" : ", and so do reads"), "bad"); }, "danger");
K.button("Repair everything", () => { dead = 0; dbDown = false; loggedOut = 0; log.add("All components healthy", "ok"); });

const cv = K.canvas(190, () => draw());
const stats = K.stats({ p50: "p50 latency", p99: "p99 latency", err: "error rate", web: "web load", db: "primary DB load", hit: "cache hit rate" });
const chart = K.chart([{ name: "p99 ms" }, { name: "errors %", color: "bad" }], { height: 150 });
const log = K.log(90);

function sim() {
  const total = rps.value;
  const staticShare = 0.4;                       // 40% of requests are static assets
  const dyn = S.cdn ? total * (1 - staticShare) : total;
  const alive = Math.max(0, (S.lb ? S.servers : 1) - dead);
  const webLoad = alive ? dyn / (alive * CAP.server) : Infinity;
  const reads = dyn * readPct.value / 100, writes = dyn - reads;
  const hit = S.cache ? 0.85 : 0;
  const dbReads = reads * (1 - hit);
  const primaryLoad = dbDown ? Infinity : (writes + (S.replica ? 0 : dbReads)) / CAP.db;
  const replicaLoad = S.replica ? dbReads / CAP.replica : 0;
  const q = (u) => (u >= 1 ? 2000 : 1 / (1 - u));   // queueing blow-up as utilisation approaches 1
  const base = 20 + (S.cdn ? 0 : 15);
  const p50 = base * q(Math.min(webLoad, 0.99)) + 8 * (1 - hit) * q(Math.min(Math.max(primaryLoad, replicaLoad), 0.99));
  let err = 0;
  if (webLoad >= 1) err += (1 - 1 / webLoad);
  if (dbDown) err += (writes + (S.replica ? 0 : reads * (1 - hit))) / dyn;
  else if (Math.max(primaryLoad, replicaLoad) >= 1) err += 0.3;
  if (alive === 0) err = 1;
  err = Math.min(1, err + loggedOut / 1000);
  return { p50, p99: p50 * 3.2, err, webLoad, primaryLoad, hit };
}

function box(ctx, x, y, w, h, label, on, bad) {
  ctx.fillStyle = bad ? K.color("bad") : on ? K.color("c1") : K.color("line");
  ctx.globalAlpha = on ? 0.9 : 0.5; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
  ctx.fillStyle = on ? "#fff" : K.color("muted"); ctx.font = "12px system-ui"; ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 4); ctx.textAlign = "start";
}
let t = 0;
function draw() {
  const { ctx, width: W } = cv; cv.clear();
  const col = (i) => 10 + i * (W - 20) / 5;
  const bw = Math.min(110, (W - 20) / 5 - 12);
  box(ctx, col(0), 80, bw, 30, "Users", true);
  box(ctx, col(1), 20, bw, 30, "CDN", S.cdn);
  box(ctx, col(1), 80, bw, 30, "Load balancer", S.lb);
  const n = S.lb ? S.servers : 1;
  for (let i = 0; i < n; i++) box(ctx, col(2), 10 + i * (170 / n), bw, Math.max(12, 170 / n - 4), n > 4 ? "" : "Web " + (i + 1), true, i < dead);
  box(ctx, col(3), 40, bw, 30, "Redis cache", S.cache);
  box(ctx, col(4), 60, bw, 30, "Primary DB", true, dbDown);
  box(ctx, col(4), 120, bw, 30, "Read replica", S.replica);
  ctx.fillStyle = K.color("c2");
  const dots = Math.min(30, Math.round(rps.value / 100));
  for (let i = 0; i < dots; i++) {
    const p = ((t * 0.02 + i / dots) % 1);
    ctx.beginPath(); ctx.arc(col(0) + bw + p * (col(2) - col(0) - bw), 95 + Math.sin(i * 7) * 10, 3, 0, 7); ctx.fill();
  }
}
K.loop(() => {
  t++;
  const r = sim();
  stats.set("p50", r.p50.toFixed(0) + " ms");
  stats.set("p99", r.p99.toFixed(0) + " ms", r.p99 > 500 ? "bad" : null);
  stats.set("err", (r.err * 100).toFixed(1) + "%", r.err > 0.01 ? "bad" : "ok");
  stats.set("web", isFinite(r.webLoad) ? (r.webLoad * 100).toFixed(0) + "%" : "down", r.webLoad > 0.8 ? "bad" : null);
  stats.set("db", isFinite(r.primaryLoad) ? (r.primaryLoad * 100).toFixed(0) + "%" : "down", r.primaryLoad > 0.8 ? "bad" : null);
  stats.set("hit", (r.hit * 100).toFixed(0) + "%");
  if (t % 5 === 0) chart.push(Math.min(r.p99, 3000), r.err * 100);
  draw();
}, 100);
log.add("Tip: raise traffic to 2000 rps with one server, then add a load balancer and more servers.", "muted");
