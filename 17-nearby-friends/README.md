# 17 · Nearby Friends

> Notes: [Nearby Friends](https://github.com/liquidslr/system-design-notes/tree/main/17.%20Nearby%20Friends) · Phase 3: Geo and real-time location · Suggested time: 1 week

## Goal
Build a real-time "friends near you" feature: clients stream locations over WebSockets, servers fan them out to friends through Redis pub/sub, and only nearby updates reach the user.

## What you'll build
- WebSocket servers holding each user's connection and their friends' latest positions.
- Location cache in Redis with TTL (inactive users fall out).
- Redis pub/sub: one channel per user; on connect, subscribe to all friends' channels.
- Distance filter (haversine) on the receiving side, so users only see friends within 5 miles.
- A simulator that moves 10k fake users on random walks and reports end-to-end update latency.
- Location history written to a time-series-ish table (Postgres or Cassandra).

## Key concepts exercised
- Persistent WebSocket connections and stateful servers
- Pub/sub fan-out
- Sharding pub/sub with consistent hashing
- Back-of-envelope for 334k location updates/sec
- Handling users with many friends
- TTL caches

## Milestones
- [ ] Make `pytest 17-nearby-friends` pass (nearby filter + cache TTL).
- [ ] Build the WebSocket server with Redis pub/sub and run the simulator with 1k users.
- [ ] Scale to 3 WebSocket servers behind nginx and 2 Redis pub/sub nodes sharded with your chapter 5 ring.
- [ ] Measure CPU per server and update latency at 10k users.

## Stretch goals
- [ ] "Nearby random people" using geohash channels (reuse chapter 16).
- [ ] Graceful drain of a WebSocket server during deploys.
- [ ] Replace Redis pub/sub with Erlang/Elixir processes or NATS and compare.

## Suggested stack
Python 3.11, FastAPI WebSockets, Redis (pub/sub + cache), nginx, pytest

## Starter files
- `nearby.py`
- `tests/test_nearby.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 17-nearby-friends
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
