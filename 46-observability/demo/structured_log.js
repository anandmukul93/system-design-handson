// Structured logs: one JSON object per line, carrying the trace id, so a log line leads straight to its trace.
import { culprit } from "./tracer.js";

export function logLine(trace, slowMs) {
  const level = trace.error ? "error" : trace.durationMs > slowMs ? "warn" : "info";
  return {
    level,
    trace_id: trace.traceId,
    service: culprit(trace).service,
    msg: trace.error ? "upstream failed" : "request done",
    dur_ms: Math.round(trace.durationMs),
  };
}
