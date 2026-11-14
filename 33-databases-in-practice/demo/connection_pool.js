// Connection pool sizing with Little's law: connections in use = arrival rate × time each query holds one.
export function poolHealth({ poolSize, requestsPerSecond, queryMs }) {
  const busyConnections = (requestsPerSecond * queryMs) / 1000;
  const utilisation = busyConnections / poolSize;
  const waitMs = utilisation >= 1 ? Infinity : (queryMs * utilisation) / (1 - utilisation) / poolSize;
  let verdict = "healthy";
  if (utilisation > 0.85) verdict = "near saturation";
  if (utilisation >= 1) verdict = "queue grows forever: add connections or speed up queries";
  return { utilisation, waitMs, verdict };
}
