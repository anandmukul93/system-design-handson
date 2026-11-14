// Number formatting helpers shared by the UI (bytes with units, short counts, durations).
export function formatBytes(b) {
  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  let i = 0;
  while (b >= 1000 && i < units.length - 1) {
    b /= 1000;
    i++;
  }
  return b.toFixed(b < 10 ? 1 : 0) + " " + units[i];
}
export function formatCount(n) {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "k";
  return n.toFixed(0);
}
export function formatDuration(seconds) {
  if (seconds > 86400) return (seconds / 86400).toFixed(1) + " days";
  if (seconds > 3600) return (seconds / 3600).toFixed(1) + " h";
  return (seconds / 60).toFixed(1) + " min";
}
export function formatNanos(ns) {
  if (ns >= 1e6) return ns / 1e6 + " ms";
  if (ns >= 1e3) return ns / 1e3 + " µs";
  return ns + " ns";
}
