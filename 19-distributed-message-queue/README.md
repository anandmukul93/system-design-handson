# 19 · Distributed Message Queue

> Notes: [Distributed Message Queue](https://github.com/liquidslr/system-design-notes/tree/main/19.%20Distributed%20Message%20Queue) · Phase 4: Data infrastructure · Suggested time: 2 weeks

## Goal
Build a mini Kafka: segmented append-only logs per partition, offsets, consumer groups with committed offsets, batching, and leader/follower replication with ISR.

## What you'll build
- Partition log stored as segment files (`00000000000000000000.log` + sparse `.index`), rolled at a size limit, with retention by age/size.
- Broker over TCP or HTTP: produce (batched), fetch(offset, max_bytes).
- Topics with N partitions; producer-side partitioner by key hash.
- Consumer groups: a coordinator assigns partitions, consumers commit offsets, rebalancing when members join/leave (heartbeats).
- Replication: one leader + followers pulling from the leader; in-sync replica set; `acks=0/1/all`.

## Key concepts exercised
- Messaging models: point-to-point vs pub/sub
- Partitions, ordering per partition
- Segmented WAL, sequential I/O, page cache
- Batching for throughput
- Consumer groups and rebalancing
- Replication, ISR, acks
- At-most / at-least / exactly-once

## Milestones
- [ ] Make `pytest 19-distributed-message-queue` pass (segmented log + consumer group offsets).
- [ ] Wrap the log in a broker server; produce 1M messages with and without batching; record MB/s.
- [ ] Add consumer groups with rebalancing; kill a consumer and watch partitions move.
- [ ] Add a follower replica and test `acks=all` vs `acks=1` under leader failure.

## Stretch goals
- [ ] Log compaction by key.
- [ ] Delayed / scheduled messages.
- [ ] Use etcd/ZooKeeper (or a Raft library) for controller election.

## Suggested stack
Python 3.11 (asyncio TCP) or Go if you want speed, pytest

## Starter files
- `partition_log.py`
- `tests/test_partition_log.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 19-distributed-message-queue
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
