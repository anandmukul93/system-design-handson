// Variant 1, two-phase commit. Contract shared with saga.js:
//   (services, failingService, options) -> { states: { service: state }, steps: [{ text, kind }] }
// Phase 1: every participant reserves, locks and votes. Phase 2: the coordinator tells all to commit or abort.
// Atomic and isolated, but everyone holds locks while waiting, and a dead coordinator blocks them all.
export function twoPhaseCommit(services, failingService, { coordinatorCrashes = false } = {}) {
  const states = {};
  const steps = [{ text: "phase 1: coordinator sends PREPARE to all", kind: "muted" }];
  let allVotedYes = true;
  for (const service of services) {
    if (service === failingService) {
      states[service] = "voted NO";
      allVotedYes = false;
      steps.push({ text: `${service}: cannot reserve → NO`, kind: "bad" });
    } else {
      states[service] = "prepared (locks held)";
      steps.push({ text: `${service}: reserved and locked → YES`, kind: "ok" });
    }
  }
  if (coordinatorCrashes) {
    steps.push({
      text: "coordinator crashed before deciding: participants stay prepared, holding locks, blocked until it recovers",
      kind: "bad",
    });
    return { states, steps };
  }
  steps.push({
    text: `phase 2: ${allVotedYes ? "COMMIT" : "ABORT"} to all`,
    kind: allVotedYes ? "ok" : "warn",
  });
  for (const service of services) states[service] = allVotedYes ? "committed" : "aborted (locks released)";
  return { states, steps };
}
