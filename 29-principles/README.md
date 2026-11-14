# 29 · Principles & Theorems

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=29-principles)

**Concepts covered:** #34 CAP Theorem · #35 Eventual Consistency · #91 Latency · #92 Throughput · #93 P99 Latency · #94 Tail Latency · #95 Network Partitions · #96 Clock Skew

## Goal
Get the theory every design argument leans on into your hands: CAP and PACELC, eventual consistency, latency vs throughput, percentiles and tail latency, network partitions and clock skew.

## 1. Concepts
### CAP theorem
When a network partition happens, a replicated system must choose between consistency (every read sees the latest write) and availability (every request gets a non-error answer). Outside partitions, PACELC adds the second trade-off: latency vs consistency.

### Eventual consistency
Replicas may disagree for a while but converge if writes stop. You pay with stale reads and conflict resolution (last-writer-wins, vector clocks, CRDTs) and get availability and low latency.

### Latency vs throughput
Latency is how long one request takes; throughput is how many complete per second. Little's law ties them: concurrency = arrival rate x latency. Batching raises throughput and usually raises latency.

### P99 latency
Averages hide outliers. P99 is the value 99% of requests are faster than. Users hit tail latency more often than you think, because one page load makes many requests.

### Tail latency
With fan-out, the slowest backend decides the response time: if 1% of calls are slow and a request touches 100 backends, 63% of requests are slow. Hedged requests, timeouts and fewer hops tame the tail.

### Network partitions
Links fail, packets drop, and a node cannot tell a slow peer from a dead one. Quorums (W + R > N) keep reads consistent while a majority is reachable; the minority side must refuse or serve stale data.

### Clock skew
Wall clocks on different machines drift and jump (NTP). Never order events across machines by wall time; use logical clocks (Lamport, vector) or bounded-uncertainty clocks (TrueTime, HLC).

## 2. Trade-offs and optimizations
- CP systems (ZooKeeper, etcd, Spanner) refuse writes on the minority side; AP systems (Dynamo, Cassandra) accept them and reconcile later.
- Reduce tail latency with hedged/backup requests after the P95, request cancellation, and keeping fan-out small.
- Report P50/P95/P99/P99.9 with histograms (HDR, t-digest), never averages of percentiles.
- Use Little's law to size thread pools and connection pools from target throughput and latency.
- Hybrid logical clocks give you causality plus timestamps that stay close to wall time.

## 3. Demo
An interactive simulator: pick N/W/R and partition the cluster to see which operations stay available; drag the slow-backend probability and fan-out to watch P99 explode; and send messages between nodes with skewed clocks to compare wall-clock ordering with Lamport timestamps.

- **In the browser:** [29-principles on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=29-principles). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=29-principles>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `principles.py`: nearest-rank percentiles, the fan-out tail formula, Little's law, quorum availability under a partition and a Lamport clock.
- A notebook or script that generates a latency distribution (log-normal plus a slow tail) and plots P50/P99 vs fan-out.

### Milestones
- [ ] Make `pytest 29-principles` pass.
- [ ] Generate 1M log-normal latencies and compute P50/P99/P99.9 yourself; compare with numpy.
- [ ] Simulate fan-out 1..200 and plot the fraction of slow requests vs the formula.

### Starter files
- [`principles.py`](principles.py)
- [`tests/test_principles.py`](tests/test_principles.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 29-principles
```

### Stretch goals
- [ ] Implement a G-Counter and an OR-Set CRDT and merge them in random orders.
- [ ] Implement a hybrid logical clock.
- [ ] Read the Jepsen analysis of one database you use.

### Suggested stack
Python 3.11 (stdlib), matplotlib (optional), pytest

## 5. Break it
- [ ] Partition a 5-node quorum (N=5, W=3, R=3) as 2|3 and list which side can read and write.
- [ ] Skew one node's clock by +2 s and show wall-clock ordering produces an impossible history.
- [ ] Add hedged requests at P95 and measure the new P99 and the extra load.

## 6. Review
- Why is the average latency a bad SLO?
- What does a CP store do on the minority side of a partition?
- With 1% slow backends and fan-out 50, how many requests are slow?
- Why can't you order events by `time.time()` across hosts?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
