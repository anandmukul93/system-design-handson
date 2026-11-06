# 09 · Design a Web Crawler

> Notes: [Design a Web Crawler](https://github.com/liquidslr/system-design-notes/tree/main/09.%20Web%20Crawler) · Phase 2: Classic product systems · Suggested time: 1 week

## Goal
Build a polite, distributed-ready crawler with a real URL frontier (priority + politeness queues), run against a local fake web so you can crawl millions of pages safely.

## What you'll build
- A fake web generator (`fake_web.py`) that serves a synthetic site graph on localhost, including traps (infinite calendar links), duplicate pages and slow hosts.
- URL frontier: front queues by priority, back queues one-per-host, a heap of next-allowed-fetch times for politeness.
- asyncio downloader with timeouts, robots.txt cache and DNS cache.
- Content dedupe via SHA-256 of normalized body; URL-seen set via Bloom filter (reuse chapter 6).
- Workers that can be scaled out by swapping the in-memory frontier for Redis.

## Key concepts exercised
- BFS vs DFS
- URL frontier: priority and politeness
- robots.txt
- Content and URL deduplication
- Spider traps
- Robustness: retries, timeouts, checkpointing

## Milestones
- [ ] Make `pytest 09-web-crawler` pass (frontier + URL normalization).
- [ ] Run `fake_web.py` and crawl 10k pages with 1 worker, then 20 async workers. Record pages/sec.
- [ ] Add trap detection (max depth, max URL length, repeating path segments).
- [ ] Move the frontier to Redis and run 3 worker processes.

## Stretch goals
- [ ] Checkpoint frontier state and resume after kill -9.
- [ ] PageRank-ish prioritizer from in-link counts.
- [ ] Near-duplicate detection with SimHash.

## Suggested stack
Python 3.11, asyncio + aiohttp, Redis, pytest

## Starter files
- `fake_web.py`
- `frontier.py`
- `tests/test_frontier.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 09-web-crawler
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
