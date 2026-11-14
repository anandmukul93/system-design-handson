// How long to wait before retry number `attempt` (0-based). Two variants, same contract: (attempt, random) -> ms.
const BASE_MS = 50;

// Variant 1, plain exponential: 50, 100, 200… Every client that failed together retries together.
export function exponentialBackoff(attempt) {
  return BASE_MS * 2 ** attempt;
}
// Variant 2, "full jitter": a random wait up to the exponential value, which spreads the retries out.
export function jitteredBackoff(attempt, random) {
  return random() * BASE_MS * 2 ** attempt;
}
