# 25 · Real-time Gaming Leaderboard

> Phase 5: Money and correctness · Suggested time: 4-5 days · Notes: [Real-time Gaming Leaderboard](https://github.com/liquidslr/system-design-notes/tree/main/25.%20Real-time%20Gaming%20Leaderboard) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=25-gaming-leaderboard)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build a real-time monthly leaderboard on Redis sorted sets, then implement the skip list underneath yourself to understand why it's O(log n).

## 1. Concepts
### Sorted sets
Redis sorted sets keep members ordered by score with O(log n) updates and rank queries: perfect for leaderboards.

### Skip lists
Linked lists with express lanes: each node appears in random higher levels, giving O(log n) search without rebalancing.

### Why not SQL
ORDER BY score with rank calculations scans huge tables at scale.

### Scaling
Partition by score range (easy global rank) or by user hash (needs scatter-gather for top-k).

## 2. Trade-offs and optimizations
- Score-range sharding makes top-k easy and needs rebalancing as scores grow.
- Hash sharding spreads load but every top-k query touches all shards.
- Ties need a deterministic rule (earliest timestamp).

## 3. Demo
Players score points live and the leaderboard reorders. A skip list visualisation shows each insertion choosing its levels and the search path for a rank lookup; look up any player's rank and neighbours.

- **In the browser:** [25-gaming-leaderboard on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=25-gaming-leaderboard). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`skip_list.js`](demo/skip_list.js), [`leaderboard.js`](demo/leaderboard.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=25-gaming-leaderboard>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Your own skip list supporting insert/update score, rank lookup and range by rank.
- A `Leaderboard` API (FastAPI): `POST /v1/scores`, `GET /v1/scores` (top 10), `GET /v1/scores/{user_id}` (rank + 4 above/below).
- Redis implementation with ZINCRBY / ZREVRANGE / ZREVRANK, one sorted set per month (`leaderboard_2026_11`).
- Score events through a queue from a game service so the leaderboard can lag safely.
- Benchmark with 25M users: memory and ops/sec.

### Milestones
- [ ] Make `pytest 25-gaming-leaderboard` pass (skip-list leaderboard).
- [ ] Swap in Redis and expose the API; load 25M fake users and record memory.
- [ ] Partition by score range across 3 Redis instances and implement global rank.
- [ ] Compare with a Postgres `ORDER BY score DESC LIMIT 10` + rank query at 10M rows.

### Starter files
- [`leaderboard.py`](leaderboard.py)
- [`tests/test_leaderboard.py`](tests/test_leaderboard.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 25-gaming-leaderboard
```

### Stretch goals
- [ ] Tie-break by earliest timestamp (encode into the score).
- [ ] Friends-only leaderboard.
- [ ] Hash-partitioned shards with scatter-gather top-K and measure latency.

### Suggested stack
Python 3.11, Redis 7, FastAPI, Postgres (comparison), pytest

## 5. Break it
- [ ] Use a plain sorted array and time inserts at 100k players.
- [ ] Shard by hash and compute a global top 10.
- [ ] Give two players the same score.

## 6. Review
- Why are skip lists O(log n)?
- How would you get a user's rank and the 4 above and below?
- Range vs hash sharding for leaderboards?
- How do you break ties?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/25.%20Real-time%20Gaming%20Leaderboard).

## Results
_Write your measurements, failure experiments and surprises here._
