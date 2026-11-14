// Facts about one server, shared by the two server-based capacity models.
export const RPS_PER_SERVER = 100;
export const DOLLARS_PER_SERVER_HOUR = 0.1;

// queueing: latency explodes as utilisation approaches 100%
export function latencyAt(utilisation) {
  return utilisation < 1 ? 40 + 25 / (1 - Math.min(utilisation, 0.95)) : 2000;
}

// what a fleet of `servers` does with `demand` rps for one minute
export function serveMinute(servers, demand) {
  const capacity = servers * RPS_PER_SERVER;
  const utilisation = demand / capacity;
  return {
    capacity,
    latencyMs: latencyAt(utilisation),
    cost: (servers * DOLLARS_PER_SERVER_HOUR) / 60,
    overloaded: utilisation >= 1,
    utilisation: Math.min(1, utilisation),
    coldStarts: 0,
  };
}
