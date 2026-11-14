// Variant 2, orchestrated saga. Same contract as two_phase_commit.js.
// Each step commits locally straight away. If a later step fails, the orchestrator runs compensating
// actions in reverse order. No locks are held, but other transactions can see the half-finished state.
export function saga(services, failingService) {
  const states = Object.fromEntries(services.map((s) => [s, "–"]));
  const steps = [];
  const booked = [];
  for (const service of services) {
    if (service === failingService) {
      states[service] = "failed";
      steps.push({ text: `${service}: booking failed → run compensations in reverse`, kind: "bad" });
      for (const done of booked.reverse()) {
        states[done] = "cancelled (compensated)";
        steps.push({ text: `compensate: cancel ${done}`, kind: "warn" });
      }
      return { states, steps };
    }
    states[service] = "booked";
    booked.push(service);
    steps.push({ text: `${service}: booked (local commit, visible to others now)`, kind: "ok" });
  }
  steps.push({ text: "saga complete", kind: "ok" });
  return { states, steps };
}
