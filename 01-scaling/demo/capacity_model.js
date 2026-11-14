// Capacity model: turns an architecture + traffic + failures into latency, error rate and load numbers.
// Pure function, no UI. Change the constants or the formulas and press Run.
export const CAPACITY = { server: 400, db: 600, replica: 600 }; // requests/second each handles comfortably
const STATIC_SHARE = 0.4; // share of requests that are static assets (a CDN absorbs these)
const CACHE_HIT_RATE = 0.85;

// queueing blow-up: response time grows as 1 / (1 - utilisation)
const queueFactor = (utilisation) => (utilisation >= 1 ? 2000 : 1 / (1 - utilisation));

// arch:     { lb, servers, replica, cache, cdn, sessions: "memory" | "redis" }
// traffic:  { rps, readPercent }
// failures: { deadServers, dbDown, loggedOutPercent }
// returns   { p50, p99, errorRate, webLoad, primaryLoad, cacheHitRate }
export function simulate(arch, traffic, failures) {
  const dynamic = arch.cdn ? traffic.rps * (1 - STATIC_SHARE) : traffic.rps;
  const alive = Math.max(0, (arch.lb ? arch.servers : 1) - failures.deadServers);
  const webLoad = alive ? dynamic / (alive * CAPACITY.server) : Infinity;

  const reads = (dynamic * traffic.readPercent) / 100;
  const writes = dynamic - reads;
  const cacheHitRate = arch.cache ? CACHE_HIT_RATE : 0;
  const dbReads = reads * (1 - cacheHitRate);
  const primaryLoad = failures.dbDown ? Infinity : (writes + (arch.replica ? 0 : dbReads)) / CAPACITY.db;
  const replicaLoad = arch.replica ? dbReads / CAPACITY.replica : 0;
  const dbLoad = Math.max(primaryLoad, replicaLoad);

  const base = 20 + (arch.cdn ? 0 : 15);
  const p50 =
    base * queueFactor(Math.min(webLoad, 0.99)) +
    8 * (1 - cacheHitRate) * queueFactor(Math.min(dbLoad, 0.99));

  let errorRate = 0;
  if (webLoad >= 1) errorRate += 1 - 1 / webLoad;
  if (failures.dbDown) errorRate += (writes + (arch.replica ? 0 : dbReads)) / dynamic;
  else if (dbLoad >= 1) errorRate += 0.3;
  if (alive === 0) errorRate = 1;
  errorRate = Math.min(1, errorRate + failures.loggedOutPercent / 1000);

  return { p50, p99: p50 * 3.2, errorRate, webLoad, primaryLoad, cacheHitRate };
}
