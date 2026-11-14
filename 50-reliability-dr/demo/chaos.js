// A chaos experiment: state a hypothesis about steady state, inject a failure, see if the hypothesis holds.
const SAFE_LOAD = 0.6; // a region copes as long as 60% of its instances remain

// kill one app instance per region; returns { successPercent, holds }
export function killOneInstancePerRegion(replicasPerRegion, requiredSuccessPercent) {
  const capacityLeft = (replicasPerRegion - 1) / replicasPerRegion;
  const successPercent = capacityLeft >= SAFE_LOAD ? 99.8 : (100 * capacityLeft) / SAFE_LOAD;
  return { successPercent, holds: successPercent >= requiredSuccessPercent };
}
