// Distributed tracing: one trace id per request, one span per service call, each span pointing at its parent.
// span: { id, parent, service, start, duration, error }
import { CALLS, OWN_LATENCY_MS } from "./call_graph.js";

// simulate one request entering at `entry`; returns { traceId, spans, durationMs, error }
export function traceRequest(entry, faults, random) {
  const traceId = Math.floor(random() * 0xffffffff)
    .toString(16)
    .padStart(8, "0");
  const spans = [];
  const call = (service, start, parent) => {
    const span = { id: spans.length + 1, parent, service, start, duration: 0, error: false };
    spans.push(span);
    const fault = faults[service];
    let now =
      start +
      OWN_LATENCY_MS[service] * (0.6 + random() * 0.8) +
      fault.extraLatencyMs * (0.8 + random() * 0.4);
    for (const child of CALLS[service]) {
      const childSpan = call(child, now, span.id); // sequential calls: the child's time is inside ours
      now = childSpan.start + childSpan.duration;
      if (childSpan.error) span.error = true; // errors propagate up to the caller
    }
    if (random() * 100 < fault.errorPercent) span.error = true;
    span.duration = now - start;
    return span;
  };
  const root = call(entry, 0, null);
  return { traceId, spans, durationMs: root.duration, error: root.error };
}

// time a span spent in its own code, not waiting on children
export function selfTime(span, spans) {
  const inChildren = spans.filter((s) => s.parent === span.id).reduce((sum, s) => sum + s.duration, 0);
  return span.duration - inChildren;
}

// where to look first: the deepest failing span, or else the span with the most self time
export function culprit(trace) {
  const failing = trace.spans.filter((s) => s.error);
  if (failing.length) return failing[failing.length - 1];
  return trace.spans.reduce((a, b) => (selfTime(b, trace.spans) > selfTime(a, trace.spans) ? b : a));
}
