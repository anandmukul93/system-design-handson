# 04 · Design a Rate Limiter

> Phase 1: Building blocks · Suggested time: 3-4 days · Notes: [Design a Rate Limiter](https://github.com/liquidslr/system-design-notes/tree/main/04.%20Rate%20Limiter) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=04-rate-limiter)

**Concepts covered:** #1 Rate Limiting · #5 API Gateways · #39 Race Conditions

## Goal
Implement all five rate-limiting algorithms, then ship one of them as distributed middleware backed by Redis.

## 1. Concepts
### Token bucket
Tokens refill at a steady rate up to a capacity; each request spends one. Allows bursts up to the capacity and a steady average.

### Leaking bucket
Requests join a fixed-size queue drained at a constant rate: smooth output, no bursts, but recent requests may wait or be dropped.

### Fixed window
Count per window (e.g. per minute). Cheap, but up to 2x the limit can pass around a window boundary.

### Sliding window log and counter
The log keeps every timestamp (accurate, memory heavy); the counter weights the previous window's count (cheap approximation).

### Distributed rate limiting
Many app servers must share counts: keep them in Redis and make check-and-update atomic with a Lua script, or accept some over-admission with local limits.

## 2. Trade-offs and optimizations
- Burst tolerance vs smoothness: token bucket vs leaking bucket.
- Accuracy vs memory: sliding log vs sliding counter.
- Central Redis is accurate but adds a network hop; local limiters are fast but approximate.

## 3. Demo
Fire requests (single clicks or a steady stream) at all five algorithms side by side. Each shows its internal state (tokens, queue, window counts, log) and a timeline of allowed and rejected requests, so you can see the fixed-window edge burst happen.

- **In the browser:** [04-rate-limiter on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=04-rate-limiter). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`token_bucket.js`](demo/token_bucket.js), [`leaking_bucket.js`](demo/leaking_bucket.js), [`fixed_window.js`](demo/fixed_window.js), [`sliding_log.js`](demo/sliding_log.js), [`sliding_counter.js`](demo/sliding_counter.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=04-rate-limiter>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Token bucket, leaking bucket, fixed window, sliding window log and sliding window counter, each behind a common `allow(key) -> bool` interface, with an injectable clock.
- A FastAPI middleware that returns 429 with `X-Ratelimit-Remaining`, `X-Ratelimit-Limit` and `X-Ratelimit-Retry-After` headers.
- A Redis-backed token bucket implemented as a Lua script so check-and-decrement is atomic across app replicas.
- A rules file (YAML) like the chapter's Lyft-style config: per-endpoint and per-user limits.

### Milestones
- [ ] Make `pytest 04-rate-limiter` pass for all five algorithms.
- [ ] Explain, using the edge-burst tests, why fixed window lets 2x the limit through and sliding log does not.
- [ ] Implement the Redis Lua token bucket and run 3 app replicas against one Redis; verify the global limit holds.
- [ ] Add the middleware + YAML rules and load test it.

### Starter files
- [`rate_limiter.py`](rate_limiter.py)
- [`redis_token_bucket.lua`](redis_token_bucket.lua)
- [`tests/test_rate_limiter.py`](tests/test_rate_limiter.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 04-rate-limiter
```

### Stretch goals
- [ ] Measure memory per key for sliding log vs sliding counter at 1M keys.
- [ ] Run two Redis instances in different "regions" with eventual sync and measure over-admission.
- [ ] Rate limit at L4 with iptables / nginx `limit_req` and compare with your app-level limiter.

### Suggested stack
Python 3.11, FastAPI, Redis 7 (Lua), pytest

## 5. Break it
- [ ] Run 3 app replicas with per-process limiters and measure how far the global limit is exceeded.
- [ ] Make the Redis check non-atomic (GET then SET) and race two clients.
- [ ] Burst exactly at a fixed-window boundary.

## 6. Review
- Which algorithm allows bursts and which smooths them?
- Why does fixed window let through up to 2x?
- How do you make a Redis-based limiter atomic?
- What headers should a 429 response include?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/04.%20Rate%20Limiter).

## Results
_Write your measurements, failure experiments and surprises here._
