// Retry delay: exponential backoff with jitter, so retries spread out instead of arriving together.
// attempt is 1 for the first failure. base is the provider's normal latency in ticks.
export function backoffDelay(attempt, base, random) {
  return base * 2 ** attempt + Math.floor(random() * 3);
}
