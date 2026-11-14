// UI only: sliders for the assumptions, then shows what estimate() and the availability functions return.
import { estimate } from "./estimate.js";
import { combinedAvailability, downtime } from "./availability.js";
import { LATENCY_NS } from "./latency_numbers.js";
import { formatBytes, formatCount, formatDuration, formatNanos } from "./format.js";

K.title(
  "Back-of-the-envelope estimation",
  "Move the assumptions and watch QPS, storage and bandwidth update with units.",
);

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
const st = K.stats({
  wqps: "Write QPS (avg)",
  wpeak: "Write QPS (peak)",
  rqps: "Read QPS (avg)",
  rpeak: "Read QPS (peak)",
  day: "Storage per day",
  total: "Storage total",
  bw: "Egress bandwidth",
  servers: "App servers @1k QPS",
});
const work = K.code();

function update() {
  const a = {
    dauMillions: dau.value,
    writesPerUser: actions.value,
    readsPerWrite: ratio.value,
    textKB: size.value,
    mediaPercent: media.value,
    mediaMB: mediaSize.value,
    years: years.value,
    peakFactor: peak.value,
  };
  const e = estimate(a);
  st.setAll({
    wqps: formatCount(e.writeQps),
    wpeak: formatCount(e.writeQpsPeak),
    rqps: formatCount(e.readQps),
    rpeak: formatCount(e.readQpsPeak),
    day: formatBytes(e.storagePerDay),
    total: formatBytes(e.storageTotal),
    bw: formatBytes(e.egressBytesPerSecond) + "/s",
    servers: e.servers,
  });
  work.set(
    [
      `writes/day   = ${formatCount(e.users)} users x ${a.writesPerUser} = ${formatCount(e.writesPerDay)}`,
      `write QPS    = ${formatCount(e.writesPerDay)} / 86,400 s ≈ ${formatCount(e.writeQps)}   (peak x${a.peakFactor} ≈ ${formatCount(e.writeQpsPeak)})`,
      `read QPS     = write QPS x ${a.readsPerWrite} ≈ ${formatCount(e.readQps)}`,
      `bytes/write  = ${a.textKB} KB text + ${a.mediaPercent}% x ${a.mediaMB} MB media ≈ ${formatBytes(e.bytesPerWrite)}`,
      `storage/day  = ${formatCount(e.writesPerDay)} x ${formatBytes(e.bytesPerWrite)} ≈ ${formatBytes(e.storagePerDay)}`,
      `storage      = ${formatBytes(e.storagePerDay)} x 365 x ${a.years} y ≈ ${formatBytes(e.storageTotal)}`,
    ].join("\n"),
  );
}
update();

K.section("Latency ladder (log scale): how long things take");
const cv = K.canvas(LATENCY_NS.length * 24 + 10, () => ladder());
function ladder() {
  const { ctx, width } = cv;
  cv.clear();
  const max = Math.log10(150e6);
  const labelW = 190;
  ctx.font = "12px system-ui";
  LATENCY_NS.forEach(([name, ns], i) => {
    const y = 6 + i * 24;
    const w = Math.max(2, ((Math.log10(ns) + 1) / (max + 1)) * (width - labelW - 80));
    ctx.fillStyle = K.color("fg");
    ctx.fillText(name, 6, y + 13);
    ctx.fillStyle = K.color(i < 3 ? "c3" : i < 8 ? "c1" : "c2");
    ctx.fillRect(labelW, y + 2, w, 15);
    ctx.fillStyle = K.color("muted");
    ctx.fillText(formatNanos(ns), labelW + w + 6, y + 13);
  });
}
ladder();

K.section("Availability");
const nines = K.slider(
  "Availability %",
  90,
  99.999,
  99.9,
  0.001,
  () => showAvailability(),
  (v) => v.toFixed(3),
);
const deps = K.slider("Serial dependencies at that availability", 1, 10, 1, 1, () => showAvailability());
const avs = K.stats({ total: "Combined availability", year: "Downtime / year", month: "Downtime / month" });
function showAvailability() {
  const a = combinedAvailability(nines.value, deps.value);
  const d = downtime(a);
  avs.setAll({
    total: (a * 100).toFixed(4) + "%",
    year: formatDuration(d.perYear),
    month: formatDuration(d.perMonth),
  });
}
showAvailability();
