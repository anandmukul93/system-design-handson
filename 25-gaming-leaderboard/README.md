# 25 · Real-time Gaming Leaderboard

> Notes: [Real-time Gaming Leaderboard](https://github.com/liquidslr/system-design-notes/tree/main/25.%20Real-time%20Gaming%20Leaderboard) · Phase 5: Money and correctness · Suggested time: 4-5 days

## Goal
Build a real-time monthly leaderboard on Redis sorted sets, then implement the skip list underneath yourself to understand why it's O(log n).

## What you'll build
- Your own skip list supporting insert/update score, rank lookup and range by rank.
- A `Leaderboard` API (FastAPI): `POST /v1/scores`, `GET /v1/scores` (top 10), `GET /v1/scores/{user_id}` (rank + 4 above/below).
- Redis implementation with ZINCRBY / ZREVRANGE / ZREVRANK, one sorted set per month (`leaderboard_2026_11`).
- Score events through a queue from a game service so the leaderboard can lag safely.
- Benchmark with 25M users: memory and ops/sec.

## Key concepts exercised
- Sorted sets and skip lists
- Why SQL ORDER BY doesn't scale for rank queries
- Fixed vs hash partitioning of sorted sets, scatter-gather
- Tie-breaking
- NoSQL alternative (DynamoDB write sharding)

## Milestones
- [ ] Make `pytest 25-gaming-leaderboard` pass (skip-list leaderboard).
- [ ] Swap in Redis and expose the API; load 25M fake users and record memory.
- [ ] Partition by score range across 3 Redis instances and implement global rank.
- [ ] Compare with a Postgres `ORDER BY score DESC LIMIT 10` + rank query at 10M rows.

## Stretch goals
- [ ] Tie-break by earliest timestamp (encode into the score).
- [ ] Friends-only leaderboard.
- [ ] Hash-partitioned shards with scatter-gather top-K and measure latency.

## Suggested stack
Python 3.11, Redis 7, FastAPI, Postgres (comparison), pytest

## Starter files
- `leaderboard.py`
- `tests/test_leaderboard.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 25-gaming-leaderboard
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
