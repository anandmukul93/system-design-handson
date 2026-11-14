// Choosing a partition for a message. Two variants with the same contract: (key, sequence, partitionCount) -> index
// Variant 1: hash of the key. All messages with the same key land in one partition, so they stay in order.
export function byKey(key, sequence, partitionCount) {
  return Number(key.replace(/\D/g, "")) % partitionCount;
}
// Variant 2: round robin. Perfectly even load, but no ordering guarantee per key.
export function roundRobin(key, sequence, partitionCount) {
  return sequence % partitionCount;
}
