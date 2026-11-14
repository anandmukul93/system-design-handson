// Vector clocks: { node: counter }. They tell "newer than" apart from "concurrent" (a conflict).
export function descends(a, b) {
  // true when a has seen everything b has (a is the same as or newer than b)
  return Object.keys(b).every((node) => (a[node] || 0) >= b[node]);
}
export function merge(a, b) {
  const out = { ...a };
  for (const [node, counter] of Object.entries(b)) out[node] = Math.max(out[node] || 0, counter);
  return out;
}
export function increment(clock, node) {
  return { ...clock, [node]: (clock[node] || 0) + 1 };
}
export function format(clock) {
  return (
    "{" +
    Object.entries(clock)
      .map(([node, counter]) => node + ":" + counter)
      .join(",") +
    "}"
  );
}
// keep only versions that no other version supersedes: what is left are concurrent siblings
export function siblings(versions) {
  const unique = versions.filter(
    (v, i) => versions.findIndex((o) => format(o.clock) === format(v.clock)) === i,
  );
  return unique.filter((v) => !unique.some((o) => o !== v && descends(o.clock, v.clock)));
}
