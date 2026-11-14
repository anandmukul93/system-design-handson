// UI only: kill/restore buttons per region, a drawing of the three databases, and two small calculators.
import { DatabaseCluster } from "./replication.js";
import { killOneInstancePerRegion } from "./chaos.js";
import { backupsToKeep } from "./backup_retention.js";

K.title(
  "Reliability and disaster recovery",
  "Three regions, one primary database. Kill the primary or a region and watch detection, promotion and data loss.",
);

const cluster = new DatabaseCluster(["us-east", "eu-west", "ap-south"]);

K.section("Regions");
const lag = K.slider("Replication lag (ticks) for ap-south", 0, 20, 8, 1);
const sync = K.toggle("eu-west is a synchronous replica (RPO 0, slower writes)", false);
for (const region of cluster.regions) {
  K.button(
    `kill ${region.name}`,
    (e) => {
      if (region.up) region.up = false;
      else cluster.restore(region);
      e.target.textContent = `${region.up ? "kill" : "restore"} ${region.name}`;
      log.add(
        `${region.name} ${region.up ? "restored (rejoins as replica)" : "DOWN"}`,
        region.up ? "ok" : "bad",
      );
    },
    "danger",
  );
}
const st = K.stats({
  primary: "Primary",
  rto: "Time without primary",
  lost: "Writes lost (RPO)",
  failed: "Failed requests",
});
const cv = K.canvas(150, () => draw());
const log = K.log(100);

function replicationDelay(regionName) {
  if (regionName === "ap-south") return lag.value;
  if (regionName === "eu-west" && sync.value) return 0;
  return 2;
}
K.loop(() => {
  for (const e of cluster.step(replicationDelay)) log.add(e.text, e.kind);
  const primary = cluster.primary;
  st.set("primary", primary ? primary.name : "none", primary ? "ok" : "bad");
  st.set("rto", cluster.ticksWithoutPrimary + " ticks");
  st.set("lost", cluster.lostWrites, cluster.lostWrites ? "bad" : "ok");
  st.set("failed", cluster.failedRequests, cluster.failedRequests ? "warn" : "ok");
  draw();
}, 400);
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "12px system-ui";
  const w = (width - 20) / cluster.regions.length;
  cluster.regions.forEach((region, i) => {
    const x = 10 + i * w;
    ctx.fillStyle = K.color(!region.up ? "line" : region.role === "primary" ? "c1" : "c3");
    ctx.globalAlpha = 0.9;
    ctx.fillRect(x, 20, w - 16, 90);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText(region.name, x + 8, 40);
    ctx.fillText(region.up ? region.role : "DOWN", x + 8, 60);
    ctx.fillText(`LSN ${region.lsn}`, x + 8, 80);
  });
  ctx.fillStyle = K.color("muted");
  ctx.fillText(`writes committed on the primary: ${cluster.written}`, 10, 135);
}

K.section("Chaos experiment");
const hypothesis = K.slider("Steady state: success rate ≥ (%)", 90, 100, 99, 0.5);
const replicas = K.slider("App replicas per region", 1, 6, 3, 1);
K.button(
  "Kill 1 app instance in each region for 60 s",
  () => {
    const r = killOneInstancePerRegion(replicas.value, hypothesis.value);
    const verdict = r.holds ? "HOLDS" : "REJECTED: add capacity headroom";
    chaosLog.add(
      `success rate during experiment: ${r.successPercent.toFixed(1)}% → hypothesis ${verdict}`,
      r.holds ? "ok" : "bad",
    );
  },
  "primary",
);
const chaosLog = K.log(50);

K.section("Backup retention (7 daily, 4 weekly, 12 monthly)");
const days = K.slider("Show backups over the last N days", 30, 400, 120, 10, () => showBackups());
const backupsOut = K.code("");
function showBackups() {
  const { taken, kept } = backupsToKeep(new Date("2026-11-14"), days.value);
  backupsOut.set(
    `${taken} nightly snapshots taken, ${kept.length} kept, ${taken - kept.length} deleted\n${kept.join("  ")}`,
  );
}
showBackups();
