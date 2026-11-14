# 01 · Scale from Zero to Millions of Users

> Phase 0: Foundations · Suggested time: 3-4 days · Notes: [Scale from Zero to Millions of Users](https://github.com/liquidslr/system-design-notes/tree/main/01.%20Scaling) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=01-scaling)

**Concepts covered:** #2 Caching · #3 Load Balancing · #4 Reverse Proxies · #7 Docker · #29 Read Replicas · #46 Horizontal Scaling · #47 Vertical Scaling · #50 Cache Invalidation · #56 Health Checks · #93 P99 Latency

## Goal
Take one tiny web app from a single box to a load-balanced, replicated, cached deployment on your laptop, and measure what each step buys you.

## 1. Concepts
### Vertical vs horizontal scaling
Vertical means a bigger box: easy but capped and a single point of failure. Horizontal means more boxes behind a load balancer: needs a stateless tier but scales far and survives failures.

### Load balancing
A load balancer spreads requests across healthy servers and removes dead ones, so clients see one address while you add and remove servers freely.

### Database replication
A primary takes writes and streams changes to replicas that serve reads. You get read scale and a standby, and you inherit replication lag.

### Caching
Cache-aside: read the cache, on a miss load from the DB and populate the cache with a TTL; on writes update the DB and invalidate the key.

### CDN and stateless web tier
Static assets come from edge servers near users; session state moves to a shared store so any web server can handle any request.

## 2. Trade-offs and optimizations
- Every layer you add (cache, replica, queue) buys capacity and adds a consistency or failure mode.
- Cache TTLs trade freshness for DB load.
- Sticky sessions are a shortcut that breaks autoscaling and failover; prefer a shared session store.

## 3. Demo
Grow an architecture one click at a time: single server, separate DB, load balancer, replicas, cache, CDN. Traffic flows as animated dots, and live gauges show latency, server load and cache hit rate as you raise the request rate or kill components.

- **In the browser:** [01-scaling on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=01-scaling). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=01-scaling>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- A small FastAPI "profile" service backed by Postgres.
- An nginx load balancer in front of 2-3 stateless app replicas (docker compose).
- A Postgres primary + read replica, with reads routed to the replica.
- A Redis cache-aside layer in front of the DB.
- Sessions moved out of the app process into Redis so the web tier is stateless.
- A load test (locust or `hey`) run after every step, with numbers written into this README.

### Milestones
- [ ] Implement `CacheAside` in `cache_aside.py` until `pytest 01-scaling` passes.
- [ ] Single container: app + DB. Record baseline p50/p99 and RPS.
- [ ] Split DB into its own container, then add nginx + 3 replicas. Re-measure.
- [ ] Add a Postgres read replica and route GETs to it. Kill the primary and observe what breaks.
- [ ] Add Redis cache-aside for `GET /users/{id}`. Measure hit rate and latency change.
- [ ] Move sessions to Redis, kill a replica mid-load-test and confirm users stay logged in.

### Starter files
- [`Dockerfile`](Dockerfile)
- [`app/main.py`](app/main.py)
- [`cache_aside.py`](cache_aside.py)
- [`docker-compose.yml`](docker-compose.yml)
- [`nginx.conf`](nginx.conf)
- [`tests/test_cache_aside.py`](tests/test_cache_aside.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 01-scaling  # then: cd 01-scaling && docker compose up --build
```

### Stretch goals
- [ ] Serve static assets through a local CDN-like cache (nginx proxy_cache) with versioned URLs.
- [ ] Add a background job queue (Redis list or Redpanda) for sending welcome emails.
- [ ] Add Prometheus + Grafana and graph RPS, latency, cache hit ratio.
- [ ] Simulate a second "data center" with a second compose stack and geo-routing in nginx.

### Suggested stack
Python 3.11, FastAPI, Postgres 16 (streaming replication), Redis 7, nginx, locust

## 5. Break it
- [ ] Kill the primary DB and see which requests fail.
- [ ] Turn off the cache under peak load and watch the DB saturate.
- [ ] Kill a web server while users hold sessions in memory vs in Redis.

## 6. Review
- Why must the web tier be stateless before you autoscale it?
- What does a read replica not help with?
- Walk through a cache-aside read and write.
- What goes on a CDN and what doesn't?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/01.%20Scaling).

## Results
_Write your measurements, failure experiments and surprises here._
