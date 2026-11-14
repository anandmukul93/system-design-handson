// Percentage rollout of a feature flag. Each user hashes to a fixed bucket 0..99, so raising the
// percentage only ever adds users: nobody flips back and forth between old and new.
export function bucketOf(flag, user, hashFn) {
  return hashFn(`${flag}:${user}`) % 100;
}
export function isEnabled(flag, user, rolloutPercent, hashFn) {
  return bucketOf(flag, user, hashFn) < rolloutPercent;
}
