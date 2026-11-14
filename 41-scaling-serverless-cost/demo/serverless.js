// Capacity model 3: serverless functions. Same contract as fixed_servers.js.
// Capacity follows demand exactly and you pay per request, so idle time is free. The price is cold starts:
// a request that needs a new instance waits for it to boot, and idle instances are reclaimed.
const RPS_PER_INSTANCE = 10;
const DOLLARS_PER_MILLION_REQUESTS = 0.4; // compute included
const WARM_MS = 60;
const COLD_START_MS = 400;

export function serverless({ idleTimeoutMinutes }) {
  let warm = 0; // instances kept alive
  return {
    minute(m, demand) {
      const needed = Math.ceil(demand / RPS_PER_INSTANCE);
      const coldStarts = Math.max(0, needed - warm);
      const latencyMs = WARM_MS + COLD_START_MS * (coldStarts / needed);
      warm = Math.max(warm, needed);
      if (m % idleTimeoutMinutes === 0) warm = Math.max(needed, Math.floor(warm * 0.7)); // reclaim idle ones
      return {
        capacity: demand,
        latencyMs,
        cost: ((demand * 60) / 1e6) * DOLLARS_PER_MILLION_REQUESTS,
        overloaded: false,
        utilisation: 1,
        coldStarts,
      };
    },
  };
}
