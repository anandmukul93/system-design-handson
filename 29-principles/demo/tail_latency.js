// Tail at scale: a request that fans out to many backends is as slow as the slowest one.
// Two variants of the request, same contract: (fanOut, callBackend) -> latency in ms
const FAST_MS = 15; // anything slower than this counts as "slow" for hedging

// Variant 1: wait for every backend.
export function plainRequest(fanOut, callBackend) {
  let worst = 0;
  for (let i = 0; i < fanOut; i++) worst = Math.max(worst, callBackend());
  return worst;
}
// Variant 2, hedged: if a backend has not answered quickly, ask a second replica and take the first answer.
export function hedgedRequest(fanOut, callBackend) {
  let worst = 0;
  for (let i = 0; i < fanOut; i++) {
    let latency = callBackend();
    if (latency > FAST_MS) latency = Math.min(latency, FAST_MS + callBackend());
    worst = Math.max(worst, latency);
  }
  return worst;
}

// a backend that is usually fast, but slow with probability slowPercent
export function makeBackend(slowPercent, random) {
  return () => (random() * 100 < slowPercent ? 200 + random() * 800 : 5 + random() * 10);
}

// run many requests and read percentiles off the sorted latencies
export function measure(request, fanOut, callBackend, samples = 2000) {
  const latencies = Array.from({ length: samples }, () => request(fanOut, callBackend)).sort((a, b) => a - b);
  return (p) => latencies[Math.floor((latencies.length - 1) * p)];
}

// chance that at least one of `fanOut` backends is slow
export function chanceOfSlow(slowPercent, fanOut) {
  return 1 - Math.pow(1 - slowPercent / 100, fanOut);
}
