# 06 · Design a Key-Value Store

> Notes: [Design a Key-Value Store](https://github.com/liquidslr/system-design-notes/tree/main/06.%20Key-Value%20Store) · Phase 1: Building blocks · Suggested time: 2 weeks

## Goal
Build a mini Dynamo/Cassandra: an LSM storage engine on one node, then a 3+ node cluster with quorum reads/writes, vector clocks and hinted handoff.

## What you'll build
- Single node engine: write-ahead log, in-memory memtable, flush to sorted SSTable files, Bloom filter per SSTable, read path memtable -> SSTables (newest first), tombstones for deletes.
- Vector clocks to detect conflicting versions.
- A cluster of N nodes (separate processes, HTTP or gRPC) using your chapter 5 ring with replication factor N=3 and tunable W/R.
- Gossip-based failure detection (heartbeat counters) and sloppy quorum + hinted handoff when a node is down.
- Anti-entropy with a Merkle tree comparison between replicas.

## Key concepts exercised
- CAP trade-offs (CP vs AP)
- Partitioning and replication
- Quorum consensus W + R > N
- Vector clocks and conflict resolution
- Gossip protocol
- Hinted handoff, Merkle trees
- LSM write/read paths, compaction, Bloom filters

## Milestones
- [ ] Make `pytest 06-key-value-store` pass (vector clocks + Bloom filter + LSM engine).
- [ ] Add a WAL and prove crash recovery: kill -9 the process mid-write and restart.
- [ ] Run 3 nodes with N=3, W=2, R=2. Kill one node and show reads/writes still succeed.
- [ ] Partition the network (block a port) and produce a sibling conflict, then resolve it with vector clocks.
- [ ] Add Merkle-tree anti-entropy and show a revived node catches up.

## Stretch goals
- [ ] Size-tiered vs leveled compaction and measure write amplification.
- [ ] Read repair on the read path.
- [ ] Run a Jepsen-style linearizability check with a simple history checker.

## Suggested stack
Python 3.11 (asyncio + aiohttp or FastAPI per node), stdlib only for the engine, pytest

## Starter files
- `bloom.py`
- `lsm.py`
- `tests/test_kv.py`
- `vector_clock.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 06-key-value-store
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
