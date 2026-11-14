# 19 · Distributed Message Queue

> Phase 4: Data infrastructure · Suggested time: 2 weeks · Notes: [Distributed Message Queue](https://github.com/liquidslr/system-design-notes/tree/main/19.%20Distributed%20Message%20Queue) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=19-distributed-message-queue)

**Concepts covered:** #15 Message Queues · #31 Partitioning · #32 Replication · #33 Leader Election

## Goal
Build a mini Kafka: segmented append-only logs per partition, offsets, consumer groups with committed offsets, batching, and leader/follower replication with ISR.

## 1. Concepts
### Topics and partitions
A topic is split into partitions; each is an ordered, append-only log. Ordering is guaranteed only within a partition.

### Consumer groups
Partitions are divided among the consumers of a group; each consumer tracks committed offsets, and rebalancing moves partitions when members change.

### Segmented log storage
Sequential appends to segment files plus the OS page cache give huge throughput; old segments are deleted by retention.

### Replication and ISR
A leader replica takes writes; in-sync followers copy it. acks=all waits for the ISR, trading latency for durability.

### Delivery semantics
Commit before processing = at-most-once; after = at-least-once; exactly-once needs idempotent producers and transactions.

## 2. Trade-offs and optimizations
- More partitions = more parallelism, more overhead and longer rebalances.
- Batching boosts throughput and adds latency.
- acks=1 is faster but can lose data on leader failure.

## 3. Demo
Producers write to a topic with several partitions; watch messages append to segment logs, consumers in a group read and commit offsets, a consumer leave and trigger rebalancing, and a leader fail over to an in-sync replica.

- **In the browser:** [19-distributed-message-queue on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=19-distributed-message-queue). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=19-distributed-message-queue>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Partition log stored as segment files (`00000000000000000000.log` + sparse `.index`), rolled at a size limit, with retention by age/size.
- Broker over TCP or HTTP: produce (batched), fetch(offset, max_bytes).
- Topics with N partitions; producer-side partitioner by key hash.
- Consumer groups: a coordinator assigns partitions, consumers commit offsets, rebalancing when members join/leave (heartbeats).
- Replication: one leader + followers pulling from the leader; in-sync replica set; `acks=0/1/all`.

### Milestones
- [ ] Make `pytest 19-distributed-message-queue` pass (segmented log + consumer group offsets).
- [ ] Wrap the log in a broker server; produce 1M messages with and without batching; record MB/s.
- [ ] Add consumer groups with rebalancing; kill a consumer and watch partitions move.
- [ ] Add a follower replica and test `acks=all` vs `acks=1` under leader failure.

### Starter files
- [`partition_log.py`](partition_log.py)
- [`tests/test_partition_log.py`](tests/test_partition_log.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 19-distributed-message-queue
```

### Stretch goals
- [ ] Log compaction by key.
- [ ] Delayed / scheduled messages.
- [ ] Use etcd/ZooKeeper (or a Raft library) for controller election.

### Suggested stack
Python 3.11 (asyncio TCP) or Go if you want speed, pytest

## 5. Break it
- [ ] Kill a consumer and watch rebalancing.
- [ ] Produce with acks=1, kill the leader and count lost messages.
- [ ] Commit offsets before processing and crash mid-batch.

## 6. Review
- Why is ordering only per partition?
- What happens during a rebalance?
- Why is an append-only log fast?
- How do acks settings change durability?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/19.%20Distributed%20Message%20Queue).

## Results
_Write your measurements, failure experiments and surprises here._
