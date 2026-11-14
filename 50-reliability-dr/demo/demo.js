// Multi-region failover with LSNs, a chaos experiment and a backup retention policy. Edit me and press Run.
K.title("Reliability and disaster recovery", "Three regions, one primary database. Kill the primary or a region and watch detection, promotion and data loss.");

const REG = ["us-east", "eu-west", "ap-south"];
const up = Object.fromEntries(REG.map((r) => [r, true]));
const db = { "us-east": { role: "primary", lsn: 0 }, "eu-west": { role: "replica", lsn: 0 }, "ap-south": { role: "replica", lsn: 0 } };
let tick = 0, missed = 0, lost = 0, written = 0, failedReq = 0, detecting = false;
K.section("Regions");
const lag = K.slider("Replication lag (ticks) for ap-south", 0, 20, 8, 1);
const sync = K.toggle("eu-west is a synchronous replica (RPO 0, slower writes)", false);
for (const r of REG) K.button(`kill ${r}`, (e) => { up[r] = !up[r]; e.target.textContent = `${up[r] ? "kill" : "restore"} ${r}`; log.add(`${r} ${up[r] ? "restored (rejoins as replica)" : "DOWN"}`, up[r] ? "ok" : "bad"); if (up[r]) { db[r].role = "replica"; } }, "danger");
const st = K.stats({ primary: "Primary", rto: "Time without primary", lostW: "Writes lost (RPO)", fail: "Failed requests" });
const cv = K.canvas(150, () => draw());
const log = K.log(100);
const pending = [];
let noPrimarySince = null;
K.loop(() => {
  tick++;
  const prim = REG.find((r) => db[r].role === "primary" && up[r]);
  if (prim) {
    for (let i = 0; i < 5; i++) { db[prim].lsn++; written++; for (const r of REG) if (r !== prim) pending.push({ r, lsn: db[prim].lsn, at: tick + (r === "ap-south" ? lag.value : sync.value && r === "eu-west" ? 0 : 2) }); }
    noPrimarySince = null; missed = 0;
  } else {
    failedReq += 5; noPrimarySince ??= tick;
    if (++missed === 3) {                                         // 3 missed heartbeats → declare dead
      const old = REG.find((r) => db[r].role === "primary");
      const cand = REG.filter((r) => up[r] && r !== old).sort((a, b) => db[b].lsn - db[a].lsn)[0];
      if (cand) {
        const loss = old ? db[old].lsn - db[cand].lsn : 0; lost += Math.max(0, loss);
        if (old) db[old].role = "replica";
        db[cand].role = "primary";
        log.add(`failover after ${tick - noPrimarySince} ticks: promoted ${cand} (highest LSN ${db[cand].lsn}); ${loss} unreplicated writes lost; DNS / routing updated`, loss ? "warn" : "ok");
        for (const r of REG) if (r !== cand) db[r].lsn = Math.min(db[r].lsn, db[cand].lsn);   // diverged tail discarded on rejoin
        pending.length = 0;
      } else log.add("no healthy replica to promote", "bad");
    }
  }
  for (const p of [...pending]) if (p.at <= tick) { pending.splice(pending.indexOf(p), 1); if (up[p.r]) db[p.r].lsn = Math.max(db[p.r].lsn, p.lsn); }
  const pr = REG.find((r) => db[r].role === "primary" && up[r]);
  st.set("primary", pr || "none", pr ? "ok" : "bad");
  st.set("rto", noPrimarySince ? `${tick - noPrimarySince} ticks` : "0");
  st.set("lostW", lost, lost ? "bad" : "ok"); st.set("fail", failedReq, failedReq ? "warn" : "ok");
  draw();
}, 400);
function draw() {
  const { ctx, width } = cv; cv.clear(); ctx.font = "12px system-ui";
  const w = (width - 20) / 3;
  REG.forEach((r, i) => {
    const x = 10 + i * w;
    ctx.fillStyle = K.color(!up[r] ? "line" : db[r].role === "primary" ? "c1" : "c3"); ctx.globalAlpha = 0.9; ctx.fillRect(x, 20, w - 16, 90); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff"; ctx.fillText(r, x + 8, 40); ctx.fillText(!up[r] ? "DOWN" : db[r].role, x + 8, 60); ctx.fillText(`LSN ${db[r].lsn}`, x + 8, 80);
  });
  ctx.fillStyle = K.color("muted"); ctx.fillText(`writes committed on the primary: ${written}`, 10, 135);
}

K.section("Chaos experiment");
const hyp = K.slider("Steady state: success rate ≥ (%)", 90, 100, 99, 0.5);
const replicas = K.slider("App replicas per region", 1, 6, 3, 1);
K.button("Kill 1 app instance in each region for 60 s", () => {
  const capLeft = (replicas.value - 1) / replicas.value, success = capLeft >= 0.6 ? 99.8 : 100 * capLeft / 0.6;
  clog.add(`success rate during experiment: ${success.toFixed(1)}% → hypothesis ${success >= hyp.value ? "HOLDS" : "REJECTED: add capacity headroom"}`, success >= hyp.value ? "ok" : "bad");
}, "primary");
const clog = K.log(50);

K.section("Backup retention (7 daily, 4 weekly, 12 monthly)");
const daysAgo = K.slider("Show backups over the last N days", 30, 400, 120, 10, () => keep());
const kept = K.code("");
function keep() {
  const today = new Date("2026-11-14"), keepSet = new Set(), dates = [];
  for (let i = 0; i < daysAgo.value; i++) { const d = new Date(today - i * 864e5); dates.push(d); }
  const iso = (d) => d.toISOString().slice(0, 10);
  dates.slice(0, 7).forEach((d) => keepSet.add(iso(d)));
  dates.filter((d) => d.getUTCDay() === 0).slice(0, 4).forEach((d) => keepSet.add(iso(d)));
  dates.filter((d) => d.getUTCDate() === 1).slice(0, 12).forEach((d) => keepSet.add(iso(d)));
  kept.set(`${dates.length} nightly snapshots taken, ${keepSet.size} kept, ${dates.length - keepSet.size} deleted\n` + [...keepSet].sort().reverse().join("  "));
}
keep();
