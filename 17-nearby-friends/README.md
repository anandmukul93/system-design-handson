# 17 · Nearby Friends

> Phase 3: Geo and real-time location · Suggested time: 1 week · Notes: [Nearby Friends](https://github.com/liquidslr/system-design-notes/tree/main/17.%20Nearby%20Friends) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=17-nearby-friends)

**Concepts covered:** #16 Pub/Sub · #22 WebSockets

## Goal
Build a real-time "friends near you" feature: clients stream locations over WebSockets, servers fan them out to friends through Redis pub/sub, and only nearby updates reach the user.

## 1. Concepts
### Persistent connections
Each user keeps a WebSocket open; servers are stateful and hold friends' recent positions.

### Location fan-out
Every update is published to the user's pub/sub channel; friends' connections subscribe and filter by distance.

### Location cache with TTL
The latest position lives in Redis with a TTL, so inactive users drop out automatically.

### Sharding pub/sub
Hundreds of thousands of updates per second need many Redis pub/sub nodes, placed with consistent hashing.

## 2. Trade-offs and optimizations
- Push via pub/sub is real-time but CPU heavy for users with many friends.
- Update interval trades freshness for load.
- Distance filtering on the receiver is simple but wastes messages.

## 3. Demo
Friends move around a map. Each location update travels through its pub/sub channel to subscribers, and only friends inside the radius light up. Change the radius, the update interval and the number of users and watch message rates.

- **In the browser:** [17-nearby-friends on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=17-nearby-friends). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`world.js`](demo/world.js), [`location_pubsub.js`](demo/location_pubsub.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=17-nearby-friends>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- WebSocket servers holding each user's connection and their friends' latest positions.
- Location cache in Redis with TTL (inactive users fall out).
- Redis pub/sub: one channel per user; on connect, subscribe to all friends' channels.
- Distance filter (haversine) on the receiving side, so users only see friends within 5 miles.
- A simulator that moves 10k fake users on random walks and reports end-to-end update latency.
- Location history written to a time-series-ish table (Postgres or Cassandra).

### Milestones
- [ ] Make `pytest 17-nearby-friends` pass (nearby filter + cache TTL).
- [ ] Build the WebSocket server with Redis pub/sub and run the simulator with 1k users.
- [ ] Scale to 3 WebSocket servers behind nginx and 2 Redis pub/sub nodes sharded with your chapter 5 ring.
- [ ] Measure CPU per server and update latency at 10k users.

### Starter files
- [`nearby.py`](nearby.py)
- [`tests/test_nearby.py`](tests/test_nearby.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 17-nearby-friends
```

### Stretch goals
- [ ] "Nearby random people" using geohash channels (reuse chapter 16).
- [ ] Graceful drain of a WebSocket server during deploys.
- [ ] Replace Redis pub/sub with Erlang/Elixir processes or NATS and compare.

### Suggested stack
Python 3.11, FastAPI WebSockets, Redis (pub/sub + cache), nginx, pytest

## 5. Break it
- [ ] Give one user 5,000 friends and watch fan-out cost.
- [ ] Stop updates from a user and see the TTL expire them.
- [ ] Kill a pub/sub node and reroute channels.

## 6. Review
- Why one channel per user?
- Where does distance filtering happen?
- How would you shard Redis pub/sub?
- What happens when a WebSocket server restarts?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/17.%20Nearby%20Friends).

## Results
_Write your measurements, failure experiments and surprises here._
