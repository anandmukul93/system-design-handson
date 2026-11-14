# 35 · Caching Deep Dive: CDN, Edge & Invalidation

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=35-caching-deep-dive)

**Concepts covered:** #2 Caching · #48 CDN · #49 Edge Caching · #50 Cache Invalidation

## Goal
Go beyond cache-aside: build an O(1) LRU, an edge cache with TTL, stale-while-revalidate and tag purges, and versioned asset URLs.

## 1. Concepts
### Caching
Keep hot data closer to the reader. The hard parts are eviction (LRU, LFU, TTL), consistency with the source and stampedes when a hot key expires.

### CDN
A network of edge servers near users that caches static and cacheable dynamic responses. The origin sets policy with `Cache-Control`; the CDN shields it from traffic spikes and cuts latency by serving from nearby.

### Edge caching
Caching at the PoP closest to the user, including API responses: `s-maxage` for shared caches, `stale-while-revalidate` to serve slightly old content while refreshing in the background, `stale-if-error` to survive origin outages, and `Vary` to key by header.

### Cache invalidation
Ways to get stale data out: short TTLs, purge by URL, purge by surrogate key/tag (all pages showing product 42), and immutable versioned URLs (`app.3f9a1c.js`) so you never need to invalidate at all.

## 2. Trade-offs and optimizations
- Long TTL = fast and cheap but stale; short TTL = fresh but more origin load.
- stale-while-revalidate hides refresh latency; request coalescing stops stampedes.
- Tag-based purges are precise; global purges are a last resort that can melt the origin.
- Fingerprinted assets can be cached forever (`immutable`); HTML should not.
- Cache keys must include everything that changes the response (Vary) and nothing else.

## 3. Demo
A CDN simulator: users in three regions request pages through edge caches. Tune TTL and stale-while-revalidate, purge a tag, and watch hit ratio, origin load and staleness update live. A second panel shows an LRU evicting keys step by step.

- **In the browser:** [35-caching-deep-dive on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=35-caching-deep-dive). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=35-caching-deep-dive>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `cache_deep.py`: an O(1) LRU cache, an edge cache with TTL + stale-while-revalidate + surrogate-key purge, and fingerprinted asset URLs.
- nginx `proxy_cache` in front of an app with `Cache-Control` and `proxy_cache_use_stale updating`.

### Milestones
- [ ] Make `pytest 35-caching-deep-dive` pass.
- [ ] Configure nginx as an edge cache with `proxy_cache_use_stale updating` and observe the `X-Cache-Status` header.
- [ ] Serve fingerprinted assets with `Cache-Control: public, max-age=31536000, immutable`.

### Starter files
- [`cache_deep.py`](cache_deep.py)
- [`tests/test_cache_deep.py`](tests/test_cache_deep.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 35-caching-deep-dive
```

### Stretch goals
- [ ] LFU and TinyLFU admission and compare hit ratio with LRU on a Zipf workload.
- [ ] Probabilistic early expiration (XFetch).
- [ ] Put Cloudflare or Fastly in front of a demo app and use surrogate keys.

### Suggested stack
Python 3.11, nginx proxy_cache, pytest

## 5. Break it
- [ ] Expire a hot key under load without coalescing and count origin requests (stampede).
- [ ] Purge everything at peak and watch origin CPU.
- [ ] Forget `Vary: Accept-Encoding` and serve gzip to a client that can't read it.

## 6. Review
- When would you choose stale-while-revalidate over a short TTL?
- Why do versioned asset URLs remove the need for invalidation?
- What is a cache stampede and two ways to stop it?
- Why is LRU O(1) with a hash map + linked list?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
