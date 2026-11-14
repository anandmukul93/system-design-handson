// Two ways to choose a shard for a key. Same contract: (key) -> shard number 0..3.
// Variant 1, hash: spreads any key pattern evenly, but range scans must ask every shard.
export function makeHashPartitioner(hashFn, shards = 4) {
  return (key) => hashFn(key) % shards;
}
// Variant 2, range: neighbours stay together (good for scans), but sequential keys all land on the last shard.
export function makeRangePartitioner(splitPoints = ["user250", "user500", "user750"]) {
  return (key) => {
    const index = splitPoints.findIndex((split) => key < split);
    return index === -1 ? splitPoints.length : index;
  };
}

// a workload: 200 scattered user keys plus `sequentialCount` timestamp-like keys
export function sampleKeys(sequentialCount) {
  const users = Array.from({ length: 200 }, (_, i) => "user" + ((i * 7919) % 1000));
  const sequential = Array.from({ length: sequentialCount }, (_, i) => "z-ts-" + (1000 + i));
  return [...users, ...sequential];
}

export function countPerShard(keys, partitioner, shards = 4) {
  const counts = Array(shards).fill(0);
  for (const key of keys) counts[partitioner(key)]++;
  return counts;
}
