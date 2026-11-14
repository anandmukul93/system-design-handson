# 11 · Design a News Feed System

> Phase 2: Classic product systems · Suggested time: 1 week · Notes: [Design a News Feed System](https://github.com/liquidslr/system-design-notes/tree/main/11.%20News%20Feed%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=11-news-feed)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build a feed service with fan-out on write for normal users and fan-out on read for celebrities, and measure the trade-off.

## 1. Concepts
### Fan-out on write
When a user posts, push the post id into every follower's feed cache: reads are instant, writes cost one entry per follower.

### Fan-out on read
Build the feed when it's requested by pulling recent posts from followed users: cheap writes, slower reads.

### Hybrid for celebrities
Fan out on write for normal users; for accounts with millions of followers, merge their posts in at read time.

### Feed caches
Store only post ids in the feed cache and hydrate from post and user caches.

## 2. Trade-offs and optimizations
- Write amplification vs read latency is the core trade-off.
- Capping feed length bounds memory but loses deep history (fall back to DB).
- Inactive users don't need precomputed feeds.

## 3. Demo
A social graph with a few celebrities: post as different users and watch fan-out writes ripple through follower feeds, switch between push, pull and hybrid, and compare write cost and feed read latency on live counters.

- **In the browser:** [11-news-feed on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=11-news-feed). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=11-news-feed>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Post service + social graph (follow/unfollow) in Postgres.
- Fanout workers that push post IDs into followers' Redis feed lists (capped at N entries).
- Hybrid model: authors over a follower threshold are not fanned out; their posts are merged at read time.
- Feed read API that hydrates post IDs from a post cache and user cache, with cursor pagination.
- A synthetic social graph generator with a power-law follower distribution.

### Milestones
- [ ] Make `pytest 11-news-feed` pass (in-memory hybrid feed).
- [ ] Generate a 100k-user graph, run fanout workers over Redis, measure write amplification and feed latency.
- [ ] Flip the celebrity threshold and plot write cost vs read latency.
- [ ] Add like counters with Redis INCR and periodic flush to Postgres.

### Starter files
- [`feed.py`](feed.py)
- [`tests/test_feed.py`](tests/test_feed.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 11-news-feed
```

### Stretch goals
- [ ] Ranking: score by recency + affinity instead of pure time.
- [ ] Handle unfollow (remove from cached feed lazily).
- [ ] Backfill a new follower's feed with recent posts.

### Suggested stack
Python 3.11, FastAPI, Postgres, Redis, Redpanda (optional), pytest

## 5. Break it
- [ ] Make a celebrity post with pure fan-out on write and count writes.
- [ ] Use pure pull and load a heavy user's feed.
- [ ] Unfollow someone and check their posts disappear lazily.

## 6. Review
- When is fan-out on write a bad idea?
- How does the hybrid model pick who to fan out?
- Why store ids instead of full posts in the feed cache?
- How do you paginate a feed?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/11.%20News%20Feed%20System).

## Results
_Write your measurements, failure experiments and surprises here._
