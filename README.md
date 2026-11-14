# System Design, Hands-On

A hands-on system design course: **51 chapters**, each with a lesson, an interactive demo that runs in your browser,
Python starter code with tests, failure experiments and review questions. Chapters 01-28 follow
[liquidslr/system-design-notes](https://github.com/liquidslr/system-design-notes) (*System Design Interview* Vol. 1 and
2); chapters 29-51 cover the remaining concepts from the 111-concept checklist, so **all 111 concepts are mapped**
([coverage matrix](COVERAGE.md)).

**Showcase site:** <https://anandmukul93.github.io/system-design-handson/site/>, every chapter with its live demo, editable source and in-browser Python tests.

## How to use this repo

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make test CH=04          # one chapter's tests (they fail until you implement the stubs)
make site                # serve the showcase site at http://localhost:8000/site/
make up                  # optional shared infra: Postgres, Redis, Redpanda, MinIO, Grafana
```

Every chapter follows the same [learning methodology](METHODOLOGY.md):

1. **Concepts**: read the explanation of each concept.
2. **Trade-offs and optimizations**: learn the knobs and their costs.
3. **Demo**: play with the browser simulation, then edit its code.
4. **Build it**: design (`DESIGN.md`), make the tests pass, do the milestones on real infrastructure.
5. **Break it**: run the failure experiments.
6. **Review**: answer the questions and write up your results.

## Coverage of the 111 concepts

20 concepts were already covered hands-on by chapters 01-28, 25 were touched there and
now also have a dedicated chapter, and 66 are covered by the new chapters 29-51. See [COVERAGE.md](COVERAGE.md)
for the full matrix; `make site-data` fails if any concept is unmapped.

## Roadmap

Chapters build on each other: the rate limiter (04) protects the URL shortener (08), the hash ring (05) shards the KV
store (06) and pub/sub (17), resilience patterns (40) harden every service, and observability (46) watches them all.
You can do the fundamentals (29-35) alongside phases 1-2.

### Phase 0: Foundations
Tools and habits you will reuse in every later project.

- [ ] [01 · Scale from Zero to Millions of Users](01-scaling/)
- [ ] [02 · Back-of-the-Envelope Estimation](02-back-of-envelope/)
- [ ] [03 · A Framework for System Design Interviews](03-design-framework/)

### Phase 1: Building blocks
Small components that later systems are made of. Keep them; you will import them later.

- [ ] [04 · Design a Rate Limiter](04-rate-limiter/)
- [ ] [05 · Design Consistent Hashing](05-consistent-hashing/)
- [ ] [06 · Design a Key-Value Store](06-key-value-store/)
- [ ] [07 · Design a Unique ID Generator](07-unique-id-generator/)

### Phase 2: Classic product systems
End-to-end services with an API, storage, cache and queue.

- [ ] [08 · Design a URL Shortener](08-url-shortener/)
- [ ] [09 · Design a Web Crawler](09-web-crawler/)
- [ ] [10 · Design a Notification System](10-notification-system/)
- [ ] [11 · Design a News Feed System](11-news-feed/)
- [ ] [12 · Design a Chat System](12-chat-system/)
- [ ] [13 · Design a Search Autocomplete System](13-search-autocomplete/)
- [ ] [14 · Design YouTube](14-youtube/)
- [ ] [15 · Design Google Drive](15-google-drive/)
- [ ] [23 · Distributed Email Service](23-distributed-email/)

### Phase 3: Geo and real-time location
Spatial indexes, routing and streaming location updates.

- [ ] [16 · Proximity Service](16-proximity-service/)
- [ ] [17 · Nearby Friends](17-nearby-friends/)
- [ ] [18 · Google Maps](18-google-maps/)

### Phase 4: Data infrastructure
The systems other systems run on: logs, metrics, streams and blobs.

- [ ] [19 · Distributed Message Queue](19-distributed-message-queue/)
- [ ] [20 · Metrics Monitoring and Alerting System](20-metrics-monitoring/)
- [ ] [21 · Ad Click Event Aggregation](21-ad-click-aggregation/)
- [ ] [24 · S3-like Object Storage](24-object-storage/)

### Phase 5: Money and correctness
Concurrency, idempotency, ledgers and determinism, where bugs cost real money.

- [ ] [22 · Hotel Reservation System](22-hotel-reservation/)
- [ ] [25 · Real-time Gaming Leaderboard](25-gaming-leaderboard/)
- [ ] [26 · Payment System](26-payment-system/)
- [ ] [27 · Digital Wallet](27-digital-wallet/)
- [ ] [28 · Stock Exchange](28-stock-exchange/)

### Phase 6: Fundamentals deep dives
Theory, networking, APIs, databases, replication and caching: the vocabulary under every design.

- [ ] [29 · Principles & Theorems](29-principles/)
- [ ] [30 · Networking & Protocols](30-networking/)
- [ ] [31 · APIs & the Edge](31-api-edge/)
- [ ] [32 · Real-time Transports](32-realtime-transports/)
- [ ] [33 · Databases in Practice](33-databases-in-practice/)
- [ ] [34 · Replication, Sharding & Leader Election](34-replication-consensus/)
- [ ] [35 · Caching Deep Dive: CDN, Edge & Invalidation](35-caching-deep-dive/)

### Phase 7: Distributed patterns
Async work, transactions, concurrency, memory, resilience and scaling economics.

- [ ] [36 · Async Processing: Queues, Pub/Sub, Events & Cron](36-async-processing/)
- [ ] [37 · Distributed Transactions: 2PC, Sagas, Outbox & Idempotency](37-distributed-transactions/)
- [ ] [38 · Concurrency & Locking](38-concurrency-locking/)
- [ ] [39 · Memory Leaks & Garbage Collection](39-memory-gc/)
- [ ] [40 · Resilience Patterns](40-resilience-patterns/)
- [ ] [41 · Scaling, Serverless & Cost](41-scaling-serverless-cost/)

### Phase 8: Production engineering
Containers, infrastructure as code, CI/CD, releases, observability, schema changes, DR and incidents.

- [ ] [42 · Containers & Orchestration](42-containers-orchestration/)
- [ ] [43 · Infrastructure as Code: Terraform & Helm](43-infrastructure-as-code/)
- [ ] [44 · CI/CD, Build Caching & Dependencies](44-cicd-dependencies/)
- [ ] [45 · Deployments & Releases](45-deployments-releases/)
- [ ] [46 · Observability: Logs, Metrics, Traces & SLOs](46-observability/)
- [ ] [49 · Schema Evolution: Migrations & Versioning](49-schema-evolution/)
- [ ] [50 · Reliability & Disaster Recovery](50-reliability-dr/)
- [ ] [51 · Production Incidents, On-Call & Postmortems](51-incidents-oncall/)

### Phase 9: Security
Identity, secrets, encryption and web application attacks and defences.

- [ ] [47 · Identity, Secrets & Encryption](47-identity-secrets-crypto/)
- [ ] [48 · Web Application Security](48-web-security/)

## All chapters at a glance

| # | Chapter | Project | Concept ids | Demo |
|---|---------|---------|-------------|------|
| [01](01-scaling/) | Scale from Zero to Millions of Users | Nginx + replicas + Postgres replica + Redis cache, load tested | 2, 3, 4, 7, 29, 46, 47, 50, 56, 93 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=01-scaling) |
| [02](02-back-of-envelope/) | Back-of-the-Envelope Estimation | Estimation toolkit + latency bench | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=02-back-of-envelope) |
| [03](03-design-framework/) | A Framework for System Design Interviews | Design template + 45-min mock timer | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=03-design-framework) |
| [04](04-rate-limiter/) | Design a Rate Limiter | 5 algorithms + Redis Lua limiter middleware | 1, 5, 39 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=04-rate-limiter) |
| [05](05-consistent-hashing/) | Design Consistent Hashing | Hash ring with vnodes + key-movement experiment | 30 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=05-consistent-hashing) |
| [06](06-key-value-store/) | Design a Key-Value Store | LSM engine + quorum cluster with vector clocks | 30, 32, 34, 35, 95 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=06-key-value-store) |
| [07](07-unique-id-generator/) | Design a Unique ID Generator | Snowflake ID service | 43, 96 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=07-unique-id-generator) |
| [08](08-url-shortener/) | Design a URL Shortener | TinyURL clone with cache + analytics | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=08-url-shortener) |
| [09](09-web-crawler/) | Design a Web Crawler | Polite crawler over a fake local web | 11 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=09-web-crawler) |
| [10](10-notification-system/) | Design a Notification System | Multi-channel notifier with retries + dedupe | 12, 13, 20 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=10-notification-system) |
| [11](11-news-feed/) | Design a News Feed System | Hybrid fan-out feed on Redis | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=11-news-feed) |
| [12](12-chat-system/) | Design a Chat System | WebSocket chat with sync + presence | 9, 22, 23 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=12-chat-system) |
| [13](13-search-autocomplete/) | Design a Search Autocomplete System | Top-k trie typeahead service | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=13-search-autocomplete) |
| [14](14-youtube/) | Design YouTube | Upload + ffmpeg DAG transcoding + HLS playback | 48 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=14-youtube) |
| [15](15-google-drive/) | Design Google Drive | Block-level sync client + server | 23 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=15-google-drive) |
| [16](16-proximity-service/) | Proximity Service | Geohash + quadtree "near me" search | 25 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=16-proximity-service) |
| [17](17-nearby-friends/) | Nearby Friends | Live nearby friends over WebSockets + pub/sub | 16, 22 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=17-nearby-friends) |
| [18](18-google-maps/) | Google Maps | Tile server + A* routing on OSM + live ETA | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=18-google-maps) |
| [19](19-distributed-message-queue/) | Distributed Message Queue | Mini Kafka: segmented log, groups, replication | 15, 31, 32, 33 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=19-distributed-message-queue) |
| [20](20-metrics-monitoring/) | Metrics Monitoring and Alerting System | Mini Prometheus: TSDB, rollups, alerting | 58, 61, 62 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=20-metrics-monitoring) |
| [21](21-ad-click-aggregation/) | Ad Click Event Aggregation | Windowed click aggregation with watermarks | 31 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=21-ad-click-aggregation) |
| [22](22-hotel-reservation/) | Hotel Reservation System | No-double-booking reservation API | 14, 36, 37 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=22-hotel-reservation) |
| [23](23-distributed-email/) | Distributed Email Service | SMTP-in mail service with threads + search | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=23-distributed-email) |
| [24](24-object-storage/) | S3-like Object Storage | Mini S3: packed data files, versioning, GC | 72 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=24-object-storage) |
| [25](25-gaming-leaderboard/) | Real-time Gaming Leaderboard | Skip-list + Redis sorted-set leaderboard | - | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=25-gaming-leaderboard) |
| [26](26-payment-system/) | Payment System | Pay-in flow with mock PSP + double-entry ledger | 12, 14, 101 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=26-payment-system) |
| [27](27-digital-wallet/) | Digital Wallet | Event-sourced wallet with TC/C + Saga | 17, 18, 19 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=27-digital-wallet) |
| [28](28-stock-exchange/) | Stock Exchange | Matching engine + sequencer + market data | 85 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=28-stock-exchange) |
| [29](29-principles/) | Principles & Theorems | Percentiles, tail latency, quorums, Lamport clocks | 34, 35, 91, 92, 93, 94, 95, 96 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=29-principles) |
| [30](30-networking/) | Networking & Protocols | Varints, gRPC frames, DNS resolver + cache | 97, 98, 99, 100 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=30-networking) |
| [31](31-api-edge/) | APIs & the Edge | Weighted LB, versioned gateway, signed webhooks | 3, 4, 5, 101, 102 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=31-api-edge) |
| [32](32-realtime-transports/) | Real-time Transports | WebSocket frames, SSE parser, long-poll broker | 22, 23, 24 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=32-realtime-transports) |
| [33](33-databases-in-practice/) | Databases in Practice | Indexes, query plans, N+1, keyset paging, pooling | 25, 26, 27, 28, 29 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=33-databases-in-practice) |
| [34](34-replication-consensus/) | Replication, Sharding & Leader Election | Raft votes, partitioners, read-your-writes | 30, 31, 32, 33 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=34-replication-consensus) |
| [35](35-caching-deep-dive/) | Caching Deep Dive: CDN, Edge & Invalidation | O(1) LRU, edge cache with SWR + tag purge | 2, 48, 49, 50 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=35-caching-deep-dive) |
| [36](36-async-processing/) | Async Processing: Queues, Pub/Sub, Events & Cron | Cron parser, SQS-style queue + DLQ, event bus | 15, 16, 17, 20, 21 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=36-async-processing) |
| [37](37-distributed-transactions/) | Distributed Transactions: 2PC, Sagas, Outbox & Idempotency | 2PC, saga, outbox, idempotency store | 14, 18, 19 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=37-distributed-transactions) |
| [38](38-concurrency-locking/) | Concurrency & Locking | Lock ordering, deadlock detection, fencing tokens | 36, 37, 38, 39, 40, 43 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=38-concurrency-locking) |
| [39](39-memory-gc/) | Memory Leaks & Garbage Collection | Refcount vs mark-sweep, leak detection | 41, 42 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=39-memory-gc) |
| [40](40-resilience-patterns/) | Resilience Patterns | Circuit breaker, jittered retries, deadlines, backpressure | 10, 11, 12, 13, 44 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=40-resilience-patterns) |
| [41](41-scaling-serverless-cost/) | Scaling, Serverless & Cost | Target-tracking autoscaler, cold starts, cost maths | 45, 46, 47, 88, 89, 90 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=41-scaling-serverless-cost) |
| [42](42-containers-orchestration/) | Containers & Orchestration | Reconciler, probes, CrashLoopBackOff, registry | 7, 8, 9, 56, 57 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=42-containers-orchestration) |
| [43](43-infrastructure-as-code/) | Infrastructure as Code: Terraform & Helm | Terraform-style plan + Helm-style templates | 104, 105, 106 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=43-infrastructure-as-code) |
| [44](44-cicd-dependencies/) | CI/CD, Build Caching & Dependencies | Semver ranges, dependency resolver, build cache keys | 6, 103, 107, 108 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=44-cicd-dependencies) |
| [45](45-deployments-releases/) | Deployments & Releases | Flags, rolling plans, canary analysis, blue-green | 51, 52, 53, 54, 55 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=45-deployments-releases) |
| [46](46-observability/) | Observability: Logs, Metrics, Traces & SLOs | Traceparent, JSON logs, error budgets, burn rate | 58, 59, 60, 61, 62, 63, 64, 65, 66 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=46-observability) |
| [47](47-identity-secrets-crypto/) | Identity, Secrets & Encryption | JWT kid rotation, PKCE, IAM, redaction | 67, 68, 69, 70, 71, 72, 73 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=47-identity-secrets-crypto) |
| [48](48-web-security/) | Web Application Security | CORS, CSRF, XSS, SQLi, SSRF, WAF | 74, 75, 76, 77, 78, 79, 80 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=48-web-security) |
| [49](49-schema-evolution/) | Schema Evolution: Migrations & Versioning | Migration runner with checksums, upcasters | 81, 82 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=49-schema-evolution) |
| [50](50-reliability-dr/) | Reliability & Disaster Recovery | GFS backups, failover by LSN, geo routing, chaos | 83, 84, 85, 86, 87 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=50-reliability-dr) |
| [51](51-incidents-oncall/) | Production Incidents, On-Call & Postmortems | Severity, MTTx, rotations, blameless postmortems | 109, 110, 111 | [demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=51-incidents-oncall) |

## Default stack

Python 3.11 + FastAPI + pytest, with Postgres, Redis, Redpanda (Kafka API) and MinIO (S3 API) from
[`infra/docker-compose.yml`](infra/docker-compose.yml). Demos are dependency-free JavaScript; the site is static and
deploys to GitHub Pages via [`.github/workflows/pages.yml`](.github/workflows/pages.yml).

## Progress log

- YYYY-MM-DD: started 01-scaling
