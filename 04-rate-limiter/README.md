# 04 · Design a Rate Limiter

> Notes: [Design a Rate Limiter](https://github.com/liquidslr/system-design-notes/tree/main/04.%20Rate%20Limiter) · Phase 1: Building blocks · Suggested time: 3-4 days

## Goal
Implement all five rate-limiting algorithms, then ship one of them as distributed middleware backed by Redis.

## What you'll build
- Token bucket, leaking bucket, fixed window, sliding window log and sliding window counter, each behind a common `allow(key) -> bool` interface, with an injectable clock.
- A FastAPI middleware that returns 429 with `X-Ratelimit-Remaining`, `X-Ratelimit-Limit` and `X-Ratelimit-Retry-After` headers.
- A Redis-backed token bucket implemented as a Lua script so check-and-decrement is atomic across app replicas.
- A rules file (YAML) like the chapter's Lyft-style config: per-endpoint and per-user limits.

## Key concepts exercised
- The five algorithms and their trade-offs (burst, memory, accuracy)
- Race conditions in distributed counters
- Atomic Lua scripts
- Where to put the limiter (client, middleware, gateway)
- Soft vs hard limits

## Milestones
- [ ] Make `pytest 04-rate-limiter` pass for all five algorithms.
- [ ] Explain, using the edge-burst tests, why fixed window lets 2x the limit through and sliding log does not.
- [ ] Implement the Redis Lua token bucket and run 3 app replicas against one Redis; verify the global limit holds.
- [ ] Add the middleware + YAML rules and load test it.

## Stretch goals
- [ ] Measure memory per key for sliding log vs sliding counter at 1M keys.
- [ ] Run two Redis instances in different "regions" with eventual sync and measure over-admission.
- [ ] Rate limit at L4 with iptables / nginx `limit_req` and compare with your app-level limiter.

## Suggested stack
Python 3.11, FastAPI, Redis 7 (Lua), pytest

## Starter files
- `rate_limiter.py`
- `redis_token_bucket.lua`
- `tests/test_rate_limiter.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 04-rate-limiter
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
