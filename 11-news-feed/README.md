# 11 · Design a News Feed System

> Notes: [Design a News Feed System](https://github.com/liquidslr/system-design-notes/tree/main/11.%20News%20Feed%20System) · Phase 2: Classic product systems · Suggested time: 1 week

## Goal
Build a feed service with fan-out on write for normal users and fan-out on read for celebrities, and measure the trade-off.

## What you'll build
- Post service + social graph (follow/unfollow) in Postgres.
- Fanout workers that push post IDs into followers' Redis feed lists (capped at N entries).
- Hybrid model: authors over a follower threshold are not fanned out; their posts are merged at read time.
- Feed read API that hydrates post IDs from a post cache and user cache, with cursor pagination.
- A synthetic social graph generator with a power-law follower distribution.

## Key concepts exercised
- Fan-out on write vs read
- Hot keys / celebrity problem
- Cache layers (feed, content, social graph, counters)
- Cursor pagination
- Async fanout via queues

## Milestones
- [ ] Make `pytest 11-news-feed` pass (in-memory hybrid feed).
- [ ] Generate a 100k-user graph, run fanout workers over Redis, measure write amplification and feed latency.
- [ ] Flip the celebrity threshold and plot write cost vs read latency.
- [ ] Add like counters with Redis INCR and periodic flush to Postgres.

## Stretch goals
- [ ] Ranking: score by recency + affinity instead of pure time.
- [ ] Handle unfollow (remove from cached feed lazily).
- [ ] Backfill a new follower's feed with recent posts.

## Suggested stack
Python 3.11, FastAPI, Postgres, Redis, Redpanda (optional), pytest

## Starter files
- `feed.py`
- `tests/test_feed.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 11-news-feed
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
