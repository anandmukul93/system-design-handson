// UI only: controls for the architecture, a diagram, and charts of what simulate() returns.
import { simulate } from "./capacity_model.js";

K.title(
  "From one server to millions of users",
  "Turn components on, raise traffic, and kill things to see what each layer buys you.",
);

const arch = { lb: false, servers: 1, replica: false, cache: false, cdn: false, sessions: "memory" };
const failures = { deadServers: 0, dbDown: false, loggedOutPercent: 0 };

K.section("Architecture");
K.toggle("Load balancer", arch.lb, (v) => (arch.lb = v));
K.slider("Web servers", 1, 8, 1, 1, (v) => (arch.servers = v));
K.toggle("Read replica", arch.replica, (v) => (arch.replica = v));
K.toggle("Redis cache", arch.cache, (v) => (arch.cache = v));
K.toggle("CDN for static files", arch.cdn, (v) => (arch.cdn = v));
K.select("Sessions stored in", ["memory", "redis"], arch.sessions, (v) => (arch.sessions = v));

K.section("Traffic and failures");
const rps = K.slider("Requests per second", 50, 5000, 300, 50);
const readPct = K.slider("Read share %", 50, 99, 90);
K.button(
  "Kill a web server",
  () => {
    if (arch.servers - failures.deadServers <= 0) return;
    failures.deadServers++;
    const lostSessions = arch.sessions === "memory";
    if (lostSessions) failures.loggedOutPercent += Math.round(100 / Math.max(1, arch.servers));
    log.add("A web server died" + (lostSessions ? ": its users lost their sessions" : ""), "bad");
  },
  "danger",
);
K.button(
  "Kill primary DB",
  () => {
    failures.dbDown = true;
    const reads = arch.replica ? ", reads still served by the replica" : ", and so do reads";
    log.add("Primary DB down: writes fail" + reads, "bad");
  },
  "danger",
);
K.button("Repair everything", () => {
  Object.assign(failures, { deadServers: 0, dbDown: false, loggedOutPercent: 0 });
  log.add("All components healthy", "ok");
});

const cv = K.canvas(190, () => draw());
const stats = K.stats({
  p50: "p50 latency",
  p99: "p99 latency",
  err: "error rate",
  web: "web load",
  db: "primary DB load",
  hit: "cache hit rate",
});
const chart = K.chart([{ name: "p99 ms" }, { name: "errors %", color: "bad" }], { height: 150 });
const log = K.log(90);

function box(ctx, x, y, w, h, label, on, bad) {
  ctx.fillStyle = bad ? K.color("bad") : on ? K.color("c1") : K.color("line");
  ctx.globalAlpha = on ? 0.9 : 0.5;
  ctx.fillRect(x, y, w, h);
  ctx.globalAlpha = 1;
  ctx.fillStyle = on ? "#fff" : K.color("muted");
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 4);
  ctx.textAlign = "start";
}
let t = 0;
function draw() {
  const { ctx, width: W } = cv;
  cv.clear();
  const col = (i) => 10 + (i * (W - 20)) / 5;
  const bw = Math.min(110, (W - 20) / 5 - 12);
  box(ctx, col(0), 80, bw, 30, "Users", true);
  box(ctx, col(1), 20, bw, 30, "CDN", arch.cdn);
  box(ctx, col(1), 80, bw, 30, "Load balancer", arch.lb);
  const n = arch.lb ? arch.servers : 1;
  for (let i = 0; i < n; i++) {
    const label = n > 4 ? "" : "Web " + (i + 1);
    box(
      ctx,
      col(2),
      10 + i * (170 / n),
      bw,
      Math.max(12, 170 / n - 4),
      label,
      true,
      i < failures.deadServers,
    );
  }
  box(ctx, col(3), 40, bw, 30, "Redis cache", arch.cache);
  box(ctx, col(4), 60, bw, 30, "Primary DB", true, failures.dbDown);
  box(ctx, col(4), 120, bw, 30, "Read replica", arch.replica);
  ctx.fillStyle = K.color("c2");
  const dots = Math.min(30, Math.round(rps.value / 100));
  for (let i = 0; i < dots; i++) {
    const p = (t * 0.02 + i / dots) % 1;
    ctx.beginPath();
    ctx.arc(col(0) + bw + p * (col(2) - col(0) - bw), 95 + Math.sin(i * 7) * 10, 3, 0, 7);
    ctx.fill();
  }
}
const percent = (load) => (isFinite(load) ? (load * 100).toFixed(0) + "%" : "down");
K.loop(() => {
  t++;
  const r = simulate(arch, { rps: rps.value, readPercent: readPct.value }, failures);
  stats.set("p50", r.p50.toFixed(0) + " ms");
  stats.set("p99", r.p99.toFixed(0) + " ms", r.p99 > 500 ? "bad" : null);
  stats.set("err", (r.errorRate * 100).toFixed(1) + "%", r.errorRate > 0.01 ? "bad" : "ok");
  stats.set("web", percent(r.webLoad), r.webLoad > 0.8 ? "bad" : null);
  stats.set("db", percent(r.primaryLoad), r.primaryLoad > 0.8 ? "bad" : null);
  stats.set("hit", (r.cacheHitRate * 100).toFixed(0) + "%");
  if (t % 5 === 0) chart.push(Math.min(r.p99, 3000), r.errorRate * 100);
  draw();
}, 100);
log.add(
  "Tip: raise traffic to 2000 rps with one server, then add a load balancer and more servers.",
  "muted",
);
