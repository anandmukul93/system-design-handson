// Traces, correlated logs, SLIs and burn-rate alerts on a small call graph. Edit me and press Run.
K.title("Observability", "gateway → orders → (inventory, payments → bank). Inject latency or errors and follow one trace id through spans and logs.");

const GRAPH = { gateway: ["orders"], orders: ["inventory", "payments"], inventory: [], payments: ["bank"], bank: [] };
const BASE = { gateway: 5, orders: 15, inventory: 20, payments: 30, bank: 60 };
const inject = Object.fromEntries(Object.keys(GRAPH).map((s) => [s, { lat: 0, err: 0 }]));
K.section("Fault injection");
const svc = K.select("Service", Object.keys(GRAPH), "bank");
const addLat = K.slider("Extra latency (ms)", 0, 1000, 0, 50, (v) => (inject[svc.value].lat = v));
const addErr = K.slider("Error %", 0, 50, 0, 1, (v) => (inject[svc.value].err = v));
svc.el.addEventListener("change", () => { addLat.value = inject[svc.value].lat; addErr.value = inject[svc.value].err; });
const slo = K.slider("SLO: % requests OK and < 300 ms", 90, 99.9, 99, 0.1);
const st = K.stats({ sli: "SLI (last 5 min)", budget: "Error budget left (30 d)", burn: "Burn rate (1 h)", alert: "Alert" });
const chart = K.chart([{ name: "SLI %" }, { name: "SLO", color: "bad" }], { height: 130, min: 80, max: 100 });
K.section("Latest trace");
const cv = K.canvas(140, () => drawTrace());
const logs = K.log(110);
let lastTrace = null, good = 0, total = 0, budgetSpent = 0, minute = 0;
const recent = [];
function call(service, traceId, start, spans, parent) {
  const id = (spans.length + 1).toString(16).padStart(4, "0");
  const span = { service, start, dur: 0, id, parent, error: false }; spans.push(span);
  let t = start + BASE[service] * (0.6 + Math.random() * 0.8) + inject[service].lat * (0.8 + Math.random() * 0.4);
  for (const child of GRAPH[service]) { const c = call(child, traceId, t, spans, id); t = c.end; if (c.error) span.error = true; }
  if (Math.random() * 100 < inject[service].err) span.error = true;
  span.dur = t - start;
  return { end: t, error: span.error };
}
K.loop(() => {
  minute++;
  let ok = 0; const n = 50;
  for (let i = 0; i < n; i++) {
    const traceId = Math.random().toString(16).slice(2, 10), spans = [];
    const r = call("gateway", traceId, 0, spans, null);
    const good1 = !r.error && r.end < 300; if (good1) ok++;
    if (i === 0) {
      lastTrace = { traceId, spans };
      const self = (s) => s.dur - spans.filter((c) => c.parent === s.id).reduce((a, c) => a + c.dur, 0);   // time not spent in children
      const worst = spans.filter((s) => s.error).at(-1) || spans.reduce((a, b) => (self(b) > self(a) ? b : a));
      logs.add(JSON.stringify({ level: r.error ? "error" : r.end > 300 ? "warn" : "info", trace_id: traceId, service: worst.service, msg: r.error ? "upstream failed" : "request done", dur_ms: Math.round(r.end) }), r.error ? "bad" : r.end > 300 ? "warn" : "muted");
    }
  }
  recent.push(ok / n); if (recent.length > 5) recent.shift();
  const sli = (100 * recent.reduce((a, b) => a + b, 0)) / recent.length;
  const allowed = 1 - slo.value / 100, badFrac = 1 - ok / n;
  budgetSpent += badFrac / (allowed * 43200);                 // fraction of a 30-day budget burned in this minute
  const burn = allowed ? (1 - sli / 100) / allowed : 0;
  chart.push(sli, slo.value);
  st.set("sli", sli.toFixed(2) + "%", sli < slo.value ? "bad" : "ok");
  st.set("budget", Math.max(0, 100 - budgetSpent * 100).toFixed(2) + "%");
  st.set("burn", burn.toFixed(1) + "x", burn > 14.4 ? "bad" : burn > 6 ? "warn" : "ok");
  st.set("alert", burn > 14.4 ? "PAGE: fast burn (> 14.4x)" : burn > 6 ? "TICKET: slow burn (> 6x)" : "none", burn > 14.4 ? "bad" : burn > 6 ? "warn" : "ok");
  drawTrace();
}, 600);
function drawTrace() {
  const { ctx, width } = cv; cv.clear(); if (!lastTrace) return;
  const total = lastTrace.spans[0].dur, x = (t) => 100 + (t / total) * (width - 140);
  ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted"); ctx.fillText(`trace ${lastTrace.traceId}  ${total.toFixed(0)} ms`, 4, 12);
  lastTrace.spans.forEach((s, i) => {
    const y = 20 + i * 22;
    ctx.fillStyle = K.color("fg"); ctx.fillText(s.service, 4, y + 12);
    ctx.fillStyle = K.color(s.error ? "bad" : s.dur > 200 ? "warn" : i);
    ctx.fillRect(x(s.start), y, Math.max(2, x(s.start + s.dur) - x(s.start)), 16);
    ctx.fillStyle = K.color("muted"); ctx.fillText(s.dur.toFixed(0) + " ms", x(s.start + s.dur) + 4, y + 12);
  });
}
