// Smooth weighted round-robin (the nginx algorithm): spreads picks out instead of sending runs to one backend.
// weights: { name: weight }. Returns the next `count` picks.
export function smoothWeightedRoundRobin(weights, count) {
  const names = Object.keys(weights);
  const total = names.reduce((sum, n) => sum + weights[n], 0);
  if (!total) return [];
  const current = Object.fromEntries(names.map((n) => [n, 0]));
  const picks = [];
  for (let i = 0; i < count; i++) {
    for (const n of names) current[n] += weights[n]; // everyone gains their weight
    const best = names.reduce((a, b) => (current[b] > current[a] ? b : a));
    current[best] -= total; // the winner pays the total
    picks.push(best);
  }
  return picks;
}

// the naive version for comparison: each backend repeated `weight` times in a row
export function naiveWeightedRoundRobin(weights, count) {
  const cycle = Object.keys(weights).flatMap((n) => Array(weights[n]).fill(n));
  return cycle.length ? Array.from({ length: count }, (_, i) => cycle[i % cycle.length]) : [];
}
