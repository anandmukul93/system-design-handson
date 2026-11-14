// Simulated hosts that emit a cpu_usage metric, with an optional spike on the first host.
export const HOSTS = [
  { host: "web-1", region: "us" },
  { host: "web-2", region: "us" },
  { host: "web-3", region: "eu" },
  { host: "db-1", region: "eu" },
];

export function cpuReading(hostIndex, t, spiking) {
  if (hostIndex === 0 && spiking) return 92 + Math.random() * 6;
  const base = 25 + 10 * Math.sin((t + hostIndex * 7) / 9) + Math.random() * 8;
  return base + (hostIndex === 3 ? 15 : 0); // the database runs a bit hotter
}
