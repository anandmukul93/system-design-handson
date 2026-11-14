// UI only: fault sliders per service, SLO stats, and a waterfall drawing of the latest trace.
import { SERVICES, noFaults } from "./call_graph.js";
import { traceRequest } from "./tracer.js";
import { logLine } from "./structured_log.js";
import { SloTracker, FAST_BURN, SLOW_BURN } from "./slo.js";

K.title(
  "Observability",
  "gateway → orders → (inventory, payments → bank). Inject latency or errors and follow one trace id through spans and logs.",
);

const faults = noFaults();
const tracker = new SloTracker();
const SLOW_MS = 300;
const REQUESTS_PER_MINUTE = 50;

K.section("Fault injection");
const service = K.select("Service", SERVICES, "bank", () => {
  extraLatency.value = faults[service.value].extraLatencyMs;
  errorPercent.value = faults[service.value].errorPercent;
});
const extraLatency = K.slider(
  "Extra latency (ms)",
  0,
  1000,
  0,
  50,
  (v) => (faults[service.value].extraLatencyMs = v),
);
const errorPercent = K.slider("Error %", 0, 50, 0, 1, (v) => (faults[service.value].errorPercent = v));
const slo = K.slider("SLO: % requests OK and < 300 ms", 90, 99.9, 99, 0.1);
const st = K.stats({
  sli: "SLI (last 5 min)",
  budget: "Error budget left (30 d)",
  burn: "Burn rate",
  alert: "Alert",
});
const chart = K.chart([{ name: "SLI %" }, { name: "SLO", color: "bad" }], { height: 130, min: 80, max: 100 });
K.section("Latest trace");
const cv = K.canvas(140, () => drawTrace());
const logs = K.log(110);
let lastTrace = null;

// each tick is one simulated minute
K.loop(() => {
  let good = 0;
  for (let i = 0; i < REQUESTS_PER_MINUTE; i++) {
    const trace = traceRequest("gateway", faults, Math.random);
    if (!trace.error && trace.durationMs < SLOW_MS) good++;
    if (i === 0) {
      lastTrace = trace;
      const line = logLine(trace, SLOW_MS);
      logs.add(JSON.stringify(line), { error: "bad", warn: "warn", info: "muted" }[line.level]);
    }
  }
  const r = tracker.record(good / REQUESTS_PER_MINUTE, slo.value);
  const level = { page: "bad", ticket: "warn", none: "ok" }[r.alert];
  const alertText = {
    page: `PAGE: fast burn (> ${FAST_BURN}x)`,
    ticket: `TICKET: slow burn (> ${SLOW_BURN}x)`,
    none: "none",
  };
  chart.push(r.sliPercent, slo.value);
  st.set("sli", r.sliPercent.toFixed(2) + "%", r.sliPercent < slo.value ? "bad" : "ok");
  st.set("budget", r.budgetLeftPercent.toFixed(2) + "%");
  st.set("burn", r.burnRate.toFixed(1) + "x", level);
  st.set("alert", alertText[r.alert], level);
  drawTrace();
}, 600);

function drawTrace() {
  const { ctx, width } = cv;
  cv.clear();
  if (!lastTrace) return;
  const total = lastTrace.durationMs;
  const x = (ms) => 100 + (ms / total) * (width - 140);
  ctx.font = "11px system-ui";
  ctx.fillStyle = K.color("muted");
  ctx.fillText(`trace ${lastTrace.traceId}  ${total.toFixed(0)} ms`, 4, 12);
  lastTrace.spans.forEach((span, row) => {
    const y = 20 + row * 22;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(span.service, 4, y + 12);
    ctx.fillStyle = K.color(span.error ? "bad" : span.duration > 200 ? "warn" : row);
    ctx.fillRect(x(span.start), y, Math.max(2, x(span.start + span.duration) - x(span.start)), 16);
    ctx.fillStyle = K.color("muted");
    ctx.fillText(span.duration.toFixed(0) + " ms", x(span.start + span.duration) + 4, y + 12);
  });
}
