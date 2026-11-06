# 08 · Design a URL Shortener

> Notes: [Design a URL Shortener](https://github.com/liquidslr/system-design-notes/tree/main/08.%20URL%20Shortener) · Phase 2: Classic product systems · Suggested time: 3-4 days

## Goal
Ship a working TinyURL clone: base62 short codes from your chapter 7 IDs, cached redirects, and click analytics.

## What you'll build
- `POST /api/v1/data/shorten` returning a 7-char base62 code; `GET /{code}` returning 301 (or 302 when analytics is on).
- Postgres table `(id, short_code, long_url, created_at)` with a unique index on `long_url` to dedupe.
- Redis cache in front of redirects (read heavy: ~10:1).
- Two shortening strategies to compare: hash + collision resolution (CRC32/MD5 prefix + bloom filter), and base62(snowflake id).
- Async click logging to a queue and a `/stats/{code}` endpoint.

## Key concepts exercised
- Base62 conversion
- Hash + collision resolution vs unique-ID based codes
- 301 vs 302 trade-off
- Cache for read-heavy traffic
- Rate limiting writes (reuse chapter 4)

## Milestones
- [ ] Make `pytest 08-url-shortener` pass.
- [ ] Build the FastAPI service with Postgres + Redis via docker compose.
- [ ] Load test redirects with and without the cache; record p99.
- [ ] Add rate limiting to `/shorten` using your chapter 4 limiter.

## Stretch goals
- [ ] Custom aliases and expiry (TTL + lazy deletion).
- [ ] Shard the URL table by short_code and route with your chapter 5 ring.
- [ ] Abuse protection: block known-bad domains with a Bloom filter.

## Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## Starter files
- `app.py`
- `base62.py`
- `shortener.py`
- `tests/test_shortener.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 08-url-shortener && cd 08-url-shortener && uvicorn app:app --reload
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
