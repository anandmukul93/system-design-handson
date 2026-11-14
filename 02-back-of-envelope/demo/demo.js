// Estimation calculator + latency ladder. Edit me and press Run.
K.title("Back-of-the-envelope estimation", "Move the assumptions and watch QPS, storage and bandwidth update with units.");

const fmtBytes = (b) => { const u = ["B", "KB", "MB", "GB", "TB", "PB", "EB"]; let i = 0; while (b >= 1000 && i < u.length - 1) { b /= 1000; i++; } return b.toFixed(b < 10 ? 1 : 0) + " " + u[i]; };
const fmtNum = (n) => n >= 1e9 ? (n / 1e9).toFixed(1) + "B" : n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? (n / 1e3).toFixed(1) + "k" : n.toFixed(0);

K.section("Assumptions (Twitter-like defaults)");
const dau = K.slider("Daily active users (M)", 1, 1000, 150, 1, update);
const actions = K.slider("Writes per user per day", 0.1, 20, 2, 0.1, update);
const ratio = K.slider("Reads per write", 1, 200, 100, 1, update);
const size = K.slider("Bytes per write (KB)", 0.1, 1000, 1, 0.1, update);
const media = K.slider("Writes with media %", 0, 100, 10, 1, update);
const mediaSize = K.slider("Media size (MB)", 0.1, 50, 1, 0.1, update);
const years = K.slider("Retention (years)", 1, 10, 5, 1, update);
const peak = K.slider("Peak factor", 1, 10, 2, 0.5, update);

K.section("Estimates");
const st = K.stats({ wqps: "Write QPS (avg)", wpeak: "Write QPS (peak)", rqps: "Read QPS (avg)", rpeak: "Read QPS (peak)", day: "Storage per day", total: "Storage total", bw: "Egress bandwidth", servers: "App servers @1k QPS" });
const work = K.code();

function update() {
  const writesDay = dau.value * 1e6 * actions.value;
  const wq = writesDay / 86400, rq = wq * ratio.value;
  const perWrite = size.value * 1e3 + (media.value / 100) * mediaSize.value * 1e6;
  const day = writesDay * perWrite;
  st.setAll({
    wqps: fmtNum(wq), wpeak: fmtNum(wq * peak.value), rqps: fmtNum(rq), rpeak: fmtNum(rq * peak.value),
    day: fmtBytes(day), total: fmtBytes(day * 365 * years.value), bw: fmtBytes(rq * perWrite) + "/s",
    servers: Math.ceil((wq + rq) * peak.value / 1000),
  });
  work.set(`writes/day   = ${fmtNum(dau.value * 1e6)} users x ${actions.value} = ${fmtNum(writesDay)}
write QPS    = ${fmtNum(writesDay)} / 86,400 s ≈ ${fmtNum(wq)}   (peak x${peak.value} ≈ ${fmtNum(wq * peak.value)})
read QPS     = write QPS x ${ratio.value} ≈ ${fmtNum(rq)}
bytes/write  = ${size.value} KB text + ${media.value}% x ${mediaSize.value} MB media ≈ ${fmtBytes(perWrite)}
storage/day  = ${fmtNum(writesDay)} x ${fmtBytes(perWrite)} ≈ ${fmtBytes(day)}
storage      = ${fmtBytes(day)} x 365 x ${years.value} y ≈ ${fmtBytes(day * 365 * years.value)}`);
}
update();

K.section("Latency ladder (log scale): how long things take");
const L = [["L1 cache", 0.5], ["Branch mispredict", 5], ["Main memory", 100], ["Compress 1 KB", 10e3], ["Send 2 KB over 1 Gbps", 20e3],
  ["SSD random read", 150e3], ["Read 1 MB from memory", 250e3], ["Datacenter round trip", 500e3], ["Read 1 MB from SSD", 1e6],
  ["Disk seek", 10e6], ["Read 1 MB from disk", 20e6], ["CA → Netherlands → CA", 150e6]];
const cv = K.canvas(L.length * 24 + 10, () => ladder());
function ladder() {
  const { ctx, width } = cv; cv.clear();
  const max = Math.log10(150e6), labelW = 190;
  ctx.font = "12px system-ui";
  L.forEach(([name, ns], i) => {
    const y = 6 + i * 24, w = Math.max(2, ((Math.log10(ns) + 1) / (max + 1)) * (width - labelW - 80));
    ctx.fillStyle = K.color("fg"); ctx.fillText(name, 6, y + 13);
    ctx.fillStyle = K.color(i < 3 ? "c3" : i < 8 ? "c1" : "c2"); ctx.fillRect(labelW, y + 2, w, 15);
    ctx.fillStyle = K.color("muted");
    ctx.fillText(ns >= 1e6 ? ns / 1e6 + " ms" : ns >= 1e3 ? ns / 1e3 + " µs" : ns + " ns", labelW + w + 6, y + 13);
  });
}
ladder();
K.section("Availability");
const nines = K.slider("Availability %", 90, 99.999, 99.9, 0.001, (v) => av(), (v) => v.toFixed(3));
const deps = K.slider("Serial dependencies at that availability", 1, 10, 1, 1, () => av());
const avs = K.stats({ total: "Combined availability", year: "Downtime / year", month: "Downtime / month" });
function av() {
  const a = Math.pow(nines.value / 100, deps.value), down = (1 - a) * 365 * 86400;
  const t = (s) => s > 86400 ? (s / 86400).toFixed(1) + " days" : s > 3600 ? (s / 3600).toFixed(1) + " h" : (s / 60).toFixed(1) + " min";
  avs.setAll({ total: (a * 100).toFixed(4) + "%", year: t(down), month: t(down / 12) });
}
av();
