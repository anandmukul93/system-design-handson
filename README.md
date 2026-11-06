# System Design, Hands-On

One small, runnable project per chapter of [liquidslr/system-design-notes](https://github.com/liquidslr/system-design-notes)
(the 28 chapters of *System Design Interview* Vol. 1 and 2). Reading about a system teaches you its vocabulary;
building it teaches you where it hurts. Every chapter folder has:

- a **README** with the goal, what to build, key concepts, milestones and stretch goals;
- **starter code**: stub modules for the core algorithm or data structure of that chapter;
- **tests** that define "done" for the core piece, so you can work test-first;
- room for your own `DESIGN.md` (from the [design template](03-design-framework/DESIGN_TEMPLATE.md)) and your measurements.

## How to use this repo

```bash
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
make test CH=04          # run one chapter's tests (all fail until you implement the stubs)
make up                  # optional shared infra: Postgres, Redis, Redpanda (Kafka API), MinIO
```

For each chapter, follow the same loop:

1. **Read** the chapter notes (linked at the top of each chapter README).
2. **Design** it on paper in 45 minutes using `03-design-framework/mock_timer.py`, then write `DESIGN.md`.
3. **Estimate** the scale with your chapter 2 toolkit.
4. **Build** the core: make the chapter's tests pass.
5. **Integrate**: wire the core into a service with real infra (docker compose) per the milestones.
6. **Break it**: kill processes, add latency, load test, and record results in the chapter README.
7. **Review** against the notes: what did the book do differently, and why?

## Roadmap

Chapters are ordered so that later projects reuse earlier ones: the rate limiter (04) protects the URL shortener (08),
the hash ring (05) shards the KV store (06) and pub/sub (17), Snowflake IDs (07) feed the shortener (08), the
notification system (10) receives alerts from monitoring (20), and so on.

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

## All chapters at a glance

| # | Chapter | Project | Time |
|---|---------|---------|------|
| [01](01-scaling/) | Scale from Zero to Millions of Users | Nginx + replicas + Postgres replica + Redis cache, load tested | 3-4 days |
| [02](02-back-of-envelope/) | Back-of-the-Envelope Estimation | Estimation toolkit + latency bench | 1 day |
| [03](03-design-framework/) | A Framework for System Design Interviews | Design template + 45-min mock timer | 1 day + ongoing |
| [04](04-rate-limiter/) | Design a Rate Limiter | 5 algorithms + Redis Lua limiter middleware | 3-4 days |
| [05](05-consistent-hashing/) | Design Consistent Hashing | Hash ring with vnodes + key-movement experiment | 2 days |
| [06](06-key-value-store/) | Design a Key-Value Store | LSM engine + quorum cluster with vector clocks | 2 weeks |
| [07](07-unique-id-generator/) | Design a Unique ID Generator | Snowflake ID service | 2 days |
| [08](08-url-shortener/) | Design a URL Shortener | TinyURL clone with cache + analytics | 3-4 days |
| [09](09-web-crawler/) | Design a Web Crawler | Polite crawler over a fake local web | 1 week |
| [10](10-notification-system/) | Design a Notification System | Multi-channel notifier with retries + dedupe | 1 week |
| [11](11-news-feed/) | Design a News Feed System | Hybrid fan-out feed on Redis | 1 week |
| [12](12-chat-system/) | Design a Chat System | WebSocket chat with sync + presence | 1-2 weeks |
| [13](13-search-autocomplete/) | Design a Search Autocomplete System | Top-k trie typeahead service | 4-5 days |
| [14](14-youtube/) | Design YouTube | Upload + ffmpeg DAG transcoding + HLS playback | 1-2 weeks |
| [15](15-google-drive/) | Design Google Drive | Block-level sync client + server | 1-2 weeks |
| [16](16-proximity-service/) | Proximity Service | Geohash + quadtree "near me" search | 1 week |
| [17](17-nearby-friends/) | Nearby Friends | Live nearby friends over WebSockets + pub/sub | 1 week |
| [18](18-google-maps/) | Google Maps | Tile server + A* routing on OSM + live ETA | 1-2 weeks |
| [19](19-distributed-message-queue/) | Distributed Message Queue | Mini Kafka: segmented log, groups, replication | 2 weeks |
| [20](20-metrics-monitoring/) | Metrics Monitoring and Alerting System | Mini Prometheus: TSDB, rollups, alerting | 1-2 weeks |
| [21](21-ad-click-aggregation/) | Ad Click Event Aggregation | Windowed click aggregation with watermarks | 1-2 weeks |
| [22](22-hotel-reservation/) | Hotel Reservation System | No-double-booking reservation API | 1 week |
| [23](23-distributed-email/) | Distributed Email Service | SMTP-in mail service with threads + search | 1 week |
| [24](24-object-storage/) | S3-like Object Storage | Mini S3: packed data files, versioning, GC | 2 weeks |
| [25](25-gaming-leaderboard/) | Real-time Gaming Leaderboard | Skip-list + Redis sorted-set leaderboard | 4-5 days |
| [26](26-payment-system/) | Payment System | Pay-in flow with mock PSP + double-entry ledger | 1-2 weeks |
| [27](27-digital-wallet/) | Digital Wallet | Event-sourced wallet with TC/C + Saga | 1-2 weeks |
| [28](28-stock-exchange/) | Stock Exchange | Matching engine + sequencer + market data | 2 weeks |

Rough total: 6-8 months at ~8-10 hours a week. If you are short on time before interviews, do 01-05, 07, 08, 10-13,
16, 19, 22 and 26 first; they cover most of what interviewers ask about.

## Default stack

Python 3.11 + FastAPI + pytest for everything, with Postgres, Redis, Redpanda (Kafka-compatible) and MinIO
(S3-compatible) from [`infra/docker-compose.yml`](infra/docker-compose.yml). Where latency is the point
(19, 28), the stretch goals suggest rewriting the hot path in Go or Rust.

## Progress log

Tick the boxes in the roadmap above as you finish each chapter, and keep a dated line here:

- YYYY-MM-DD: started 01-scaling
