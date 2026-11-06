# 01 · Scale from Zero to Millions of Users

> Notes: [Scale from Zero to Millions of Users](https://github.com/liquidslr/system-design-notes/tree/main/01.%20Scaling) · Phase 0: Foundations · Suggested time: 3-4 days

## Goal
Take one tiny web app from a single box to a load-balanced, replicated, cached deployment on your laptop, and measure what each step buys you.

## What you'll build
- A small FastAPI "profile" service backed by Postgres.
- An nginx load balancer in front of 2-3 stateless app replicas (docker compose).
- A Postgres primary + read replica, with reads routed to the replica.
- A Redis cache-aside layer in front of the DB.
- Sessions moved out of the app process into Redis so the web tier is stateless.
- A load test (locust or `hey`) run after every step, with numbers written into this README.

## Key concepts exercised
- Vertical vs horizontal scaling
- Load balancing
- Primary/replica replication and replication lag
- Cache-aside, TTLs, invalidation
- Stateless web tier
- CDN for static assets
- Message queue for async work

## Milestones
- [ ] Implement `CacheAside` in `cache_aside.py` until `pytest 01-scaling` passes.
- [ ] Single container: app + DB. Record baseline p50/p99 and RPS.
- [ ] Split DB into its own container, then add nginx + 3 replicas. Re-measure.
- [ ] Add a Postgres read replica and route GETs to it. Kill the primary and observe what breaks.
- [ ] Add Redis cache-aside for `GET /users/{id}`. Measure hit rate and latency change.
- [ ] Move sessions to Redis, kill a replica mid-load-test and confirm users stay logged in.

## Stretch goals
- [ ] Serve static assets through a local CDN-like cache (nginx proxy_cache) with versioned URLs.
- [ ] Add a background job queue (Redis list or Redpanda) for sending welcome emails.
- [ ] Add Prometheus + Grafana and graph RPS, latency, cache hit ratio.
- [ ] Simulate a second "data center" with a second compose stack and geo-routing in nginx.

## Suggested stack
Python 3.11, FastAPI, Postgres 16 (streaming replication), Redis 7, nginx, locust

## Starter files
- `Dockerfile`
- `app/main.py`
- `cache_aside.py`
- `docker-compose.yml`
- `nginx.conf`
- `tests/test_cache_aside.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 01-scaling  # then: cd 01-scaling && docker compose up --build
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
