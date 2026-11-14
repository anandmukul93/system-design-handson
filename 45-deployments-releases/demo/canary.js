// Strategy 3, canary. Same contract as rolling.js.
// Send a small slice of real traffic to the new version, watch its metrics, widen in stages.
// A bad release only ever hurts the slice that was exposed.
const STAGES = [10, 50, 100];

export const canary = {
  name: "canary (10% → 50% → 100%)",
  advance(state) {
    state.v2TrafficPercent = STAGES.find((percent) => percent > state.v2TrafficPercent) ?? 100;
    return `canary at ${state.v2TrafficPercent}%`;
  },
  isComplete: (state) => state.v2TrafficPercent === 100,
};
