// Stream aggregation: tumbling windows, watermark, dedupe, late events. Edit me and press Run.
K.title("Ad click aggregation", "Clicks arrive out of order. The watermark trails the max event time; when it passes a window's end, the window closes.");

const WIN = 10, ADS = ["ad-A", "ad-B", "ad-C", "ad-D", "ad-E"];
K.section("Stream");
const rate = K.slider("Clicks / tick", 1, 30, 8, 1);
const lateness = K.slider("Max out-of-orderness (s)", 0, 30, 5, 1);
const delayP = K.slider("Events delayed %", 0, 50, 15, 1);
const dupP = K.slider("Duplicate %", 0, 30, 5, 1);
const st = K.stats({ wm: "Watermark", ev: "Event time max", in: "Events in", dup: "Duplicates dropped", late: "Late (side output)", closed: "Windows closed" });
const cv = K.canvas(150, () => draw());
const table = K.table(["Window", "State", "Top ads (clicks)"]);
const log = K.log(80);
let now = 0, maxEv = 0, evIn = 0, dups = 0, late = 0, closed = 0, nextId = 0;
const windows = new Map(), seen = new Set(), buffer = [];
const rnd = K.rng(21);

K.loop(() => {
  now++;
  for (let i = 0; i < rate.value; i++) {
    const delayed = rnd() * 100 < delayP.value;
    const e = { id: nextId++, ad: ADS[Math.floor(Math.pow(rnd(), 1.8) * ADS.length)], t: now - (delayed ? Math.floor(rnd() * 25) : 0) };
    buffer.push(e); if (rnd() * 100 < dupP.value) buffer.push({ ...e });
  }
  for (const e of buffer.splice(0)) {
    evIn++;
    if (seen.has(e.id)) { dups++; continue; } seen.add(e.id);
    maxEv = Math.max(maxEv, e.t);
    const ws = Math.floor(e.t / WIN) * WIN;
    const w = windows.get(ws);
    if ((w && w.closed) || (!w && ws + WIN <= maxEv - lateness.value)) { late++; if (late % 10 === 1) log.add(`event at t=${e.t} arrived after window [${ws},${ws + WIN}) closed → late output`, "warn"); continue; }
    if (!w) windows.set(ws, { counts: {}, closed: false });
    const c = windows.get(ws).counts; c[e.ad] = (c[e.ad] || 0) + 1;
  }
  const wm = maxEv - lateness.value;
  for (const [ws, w] of windows) if (!w.closed && ws + WIN <= wm) { w.closed = true; closed++; log.add(`watermark ${wm} ≥ ${ws + WIN}: window [${ws},${ws + WIN}) emitted`, "ok"); }
  for (const ws of [...windows.keys()]) if (ws < wm - 60) windows.delete(ws);
  st.setAll({ wm, ev: maxEv, in: evIn, dup: dups, late, closed });
  table.set([...windows].sort((a, b) => b[0] - a[0]).slice(0, 5).map(([ws, w]) => [`[${ws}, ${ws + WIN})`, K.chip(w.closed ? "closed" : "open", w.closed ? "ok" : "warn"), Object.entries(w.counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a, n]) => `${a} (${n})`).join(", ")]));
  draw(wm);
}, 1000);
function draw(wm = 0) {
  const { ctx, width } = cv; cv.clear();
  const span = 60, x = (t) => 10 + ((t - (now - span)) / span) * (width - 20);
  for (const [ws, w] of windows) { ctx.fillStyle = K.color(w.closed ? "c3" : "c1"); ctx.globalAlpha = 0.25; ctx.fillRect(x(ws), 30, x(ws + WIN) - x(ws) - 2, 80); ctx.globalAlpha = 1; ctx.fillStyle = K.color("fg"); ctx.font = "11px system-ui"; ctx.fillText(Object.values(w.counts).reduce((a, b) => a + b, 0), x(ws) + 4, 46); }
  for (const [t, col, lbl] of [[wm, "c2", "watermark"], [maxEv, "c4", "max event time"]]) { ctx.strokeStyle = K.color(col); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x(t), 20); ctx.lineTo(x(t), 120); ctx.stroke(); ctx.fillStyle = K.color(col); ctx.fillText(lbl, x(t) - 40, col === "c2" ? 135 : 15); }
}
