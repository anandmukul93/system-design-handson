# 08 · Design a URL Shortener

> Phase 2: Classic product systems · Suggested time: 3-4 days · Notes: [Design a URL Shortener](https://github.com/liquidslr/system-design-notes/tree/main/08.%20URL%20Shortener) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=08-url-shortener)

**Concepts covered:** Foundations for the rest of the course

## Goal
Ship a working TinyURL clone: base62 short codes from your chapter 7 IDs, cached redirects, and click analytics.

## 1. Concepts
### Base62 codes
Encode a unique numeric ID in base62 (0-9a-zA-Z): 7 characters cover 3.5 trillion URLs.

### Hash + collision resolution
Hash the long URL and take a prefix; on collision append a salt and retry. A Bloom filter avoids DB checks.

### 301 vs 302
301 (permanent) lets browsers cache and cuts server load; 302 (temporary) sends every click to you, which analytics needs.

### Read-heavy caching
Redirects vastly outnumber creations, so cache code -> URL in Redis.

## 2. Trade-offs and optimizations
- ID-based codes are guessable and sequential; hash-based ones need collision handling.
- Analytics needs 302 and async logging so redirects stay fast.
- Dedupe long URLs with a unique index or allow duplicates for per-user stats.

## 3. Demo
Shorten URLs and watch the base62 encoding of each ID digit by digit, then click short links through a simulated cache and database to see hits, misses and 301 vs 302 behaviour on repeat visits.

- **In the browser:** [08-url-shortener on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=08-url-shortener). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`counter_base62.js`](demo/counter_base62.js), [`hash_strategy.js`](demo/hash_strategy.js), [`lru_cache.js`](demo/lru_cache.js), [`shortener.js`](demo/shortener.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=08-url-shortener>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `POST /api/v1/data/shorten` returning a 7-char base62 code; `GET /{code}` returning 301 (or 302 when analytics is on).
- Postgres table `(id, short_code, long_url, created_at)` with a unique index on `long_url` to dedupe.
- Redis cache in front of redirects (read heavy: ~10:1).
- Two shortening strategies to compare: hash + collision resolution (CRC32/MD5 prefix + bloom filter), and base62(snowflake id).
- Async click logging to a queue and a `/stats/{code}` endpoint.

### Milestones
- [ ] Make `pytest 08-url-shortener` pass.
- [ ] Build the FastAPI service with Postgres + Redis via docker compose.
- [ ] Load test redirects with and without the cache; record p99.
- [ ] Add rate limiting to `/shorten` using your chapter 4 limiter.

### Starter files
- [`app.py`](app.py)
- [`base62.py`](base62.py)
- [`shortener.py`](shortener.py)
- [`tests/test_shortener.py`](tests/test_shortener.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 08-url-shortener && cd 08-url-shortener && uvicorn app:app --reload
```

### Stretch goals
- [ ] Custom aliases and expiry (TTL + lazy deletion).
- [ ] Shard the URL table by short_code and route with your chapter 5 ring.
- [ ] Abuse protection: block known-bad domains with a Bloom filter.

### Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## 5. Break it
- [ ] Turn off the cache and load test redirects.
- [ ] Make two clients shorten the same URL concurrently.
- [ ] Hammer `/shorten` without a rate limiter.

## 6. Review
- How long must codes be for 100 billion URLs?
- When would you use 302 instead of 301?
- Hash-based or ID-based codes: trade-offs?
- Where does the cache sit and what's its hit ratio?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/08.%20URL%20Shortener).

## Results
_Write your measurements, failure experiments and surprises here._
