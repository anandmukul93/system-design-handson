# 09 · Design a Web Crawler

> Phase 2: Classic product systems · Suggested time: 1 week · Notes: [Design a Web Crawler](https://github.com/liquidslr/system-design-notes/tree/main/09.%20Web%20Crawler) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=09-web-crawler)

**Concepts covered:** #11 Timeouts

## Goal
Build a polite, distributed-ready crawler with a real URL frontier (priority + politeness queues), run against a local fake web so you can crawl millions of pages safely.

## 1. Concepts
### BFS crawling
Treat the web as a graph and explore breadth first from seed URLs; DFS gets lost in deep sites.

### URL frontier
Front queues order URLs by priority; back queues hold one host each so a scheduler can enforce politeness delays.

### Politeness and robots.txt
Respect robots.txt and wait between requests to the same host so you don't overload it.

### Deduplication
Normalise URLs and track seen ones (Bloom filter); hash content to skip duplicate pages.

### Traps and robustness
Infinite calendars and session ids create endless URLs: cap depth and URL length, add timeouts and retries.

## 2. Trade-offs and optimizations
- More workers raise throughput until politeness and DNS become the bottleneck.
- A Bloom filter saves memory but has false positives (some pages never crawled).
- Freshness vs coverage: recrawl popular pages more often.

## 3. Demo
Crawl a generated fake web: watch the frontier's priority and per-host queues fill and drain, pages light up as they're fetched, politeness delays throttle hosts, duplicates get skipped and a spider trap is caught by the depth limit.

- **In the browser:** [09-web-crawler on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=09-web-crawler). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`fake_web.js`](demo/fake_web.js), [`crawler.js`](demo/crawler.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=09-web-crawler>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- A fake web generator (`fake_web.py`) that serves a synthetic site graph on localhost, including traps (infinite calendar links), duplicate pages and slow hosts.
- URL frontier: front queues by priority, back queues one-per-host, a heap of next-allowed-fetch times for politeness.
- asyncio downloader with timeouts, robots.txt cache and DNS cache.
- Content dedupe via SHA-256 of normalized body; URL-seen set via Bloom filter (reuse chapter 6).
- Workers that can be scaled out by swapping the in-memory frontier for Redis.

### Milestones
- [ ] Make `pytest 09-web-crawler` pass (frontier + URL normalization).
- [ ] Run `fake_web.py` and crawl 10k pages with 1 worker, then 20 async workers. Record pages/sec.
- [ ] Add trap detection (max depth, max URL length, repeating path segments).
- [ ] Move the frontier to Redis and run 3 worker processes.

### Starter files
- [`fake_web.py`](fake_web.py)
- [`frontier.py`](frontier.py)
- [`tests/test_frontier.py`](tests/test_frontier.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 09-web-crawler
```

### Stretch goals
- [ ] Checkpoint frontier state and resume after kill -9.
- [ ] PageRank-ish prioritizer from in-link counts.
- [ ] Near-duplicate detection with SimHash.

### Suggested stack
Python 3.11, asyncio + aiohttp, Redis, pytest

## 5. Break it
- [ ] Remove the per-host delay and see one host dominate.
- [ ] Disable trap detection and point at the calendar trap.
- [ ] Kill a worker mid-crawl and resume from a checkpoint.

## 6. Review
- Why BFS over DFS for crawling?
- How does the frontier enforce politeness?
- How do you detect duplicate content?
- What's a spider trap?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/09.%20Web%20Crawler).

## Results
_Write your measurements, failure experiments and surprises here._
