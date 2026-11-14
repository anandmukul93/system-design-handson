// Measurements over any router: how many keys move when servers change, and how even the load is.
// A "router" is anything with setServers(list) and owner(key).
export function keysMoved(router, keys, nextServers) {
  const before = keys.map((k) => router.owner(k));
  router.setServers(nextServers);
  return keys.filter((k, i) => router.owner(k) !== before[i]).length;
}

export function loadStats(router, keys, servers) {
  const counts = Object.fromEntries(servers.map((s) => [s, 0]));
  for (const k of keys) counts[router.owner(k)]++;
  const values = Object.values(counts);
  const mean = keys.length / servers.length;
  const stdDev = Math.sqrt(values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length);
  return { counts, mean, stdDev, maxOverMin: Math.max(...values) / Math.max(1, Math.min(...values)) };
}
