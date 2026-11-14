// One client request, wrapped in whichever protections are switched on.
// protections: { timeoutMs | null, maxAttempts, backoff, breaker | null }
// returns { ok, ms, calls }: did it succeed, how long the caller waited, how many downstream calls it cost
export function request(downstream, protections, now, random) {
  const { timeoutMs, maxAttempts, backoff, breaker } = protections;
  let ms = 0;
  let calls = 0;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (breaker && !breaker.allow(now)) return { ok: false, ms: ms + 1, calls }; // fail fast
    calls++;
    const reply = downstream.call();
    const timedOut = timeoutMs !== null && reply.ms > timeoutMs;
    ms += timedOut ? timeoutMs : reply.ms; // without a timeout the caller waits as long as it takes
    const ok = reply.ok && !timedOut;
    if (breaker) breaker.record(ok, now);
    if (ok) return { ok: true, ms, calls };
    ms += backoff(attempt, random);
  }
  return { ok: false, ms, calls };
}
