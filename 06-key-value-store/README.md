# 06 · Design a Key-Value Store

> Phase 1: Building blocks · Suggested time: 2 weeks · Notes: [Design a Key-Value Store](https://github.com/liquidslr/system-design-notes/tree/main/06.%20Key-Value%20Store) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=06-key-value-store)

**Concepts covered:** #30 Sharding · #32 Replication · #34 CAP Theorem · #35 Eventual Consistency · #95 Network Partitions

## Goal
Build a mini Dynamo/Cassandra: an LSM storage engine on one node, then a 3+ node cluster with quorum reads/writes, vector clocks and hinted handoff.

## 1. Concepts
### CAP and tunable consistency
Dynamo-style stores choose availability under partitions and let clients tune consistency with N, W and R.

### Quorums
With W + R > N, every read overlaps at least one replica that has the latest write.

### Vector clocks
Per-node counters attached to versions detect concurrent writes so both versions can be kept as siblings and reconciled.

### Gossip and hinted handoff
Nodes spread membership and heartbeat info by gossip; when a replica is down, another node keeps its writes as hints and hands them back later.

### LSM storage
Writes go to a commit log and memtable, flush to sorted SSTables, and compaction merges them. Bloom filters skip SSTables that can't contain a key.

## 2. Trade-offs and optimizations
- W=1 gives fast writes and weak durability; W=N the opposite.
- Vector clocks grow with writers; prune or use dotted version vectors.
- LSM trees favour writes; B-trees favour reads.

## 3. Demo
A five-node cluster on a ring: write and read keys with adjustable N, W and R, partition nodes and watch quorums succeed or fail, see hinted handoff and conflicting siblings with vector clocks, and step through an LSM write path from memtable to SSTables and compaction.

- **In the browser:** [06-key-value-store on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=06-key-value-store). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`vector_clock.js`](demo/vector_clock.js), [`cluster.js`](demo/cluster.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=06-key-value-store>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Single node engine: write-ahead log, in-memory memtable, flush to sorted SSTable files, Bloom filter per SSTable, read path memtable -> SSTables (newest first), tombstones for deletes.
- Vector clocks to detect conflicting versions.
- A cluster of N nodes (separate processes, HTTP or gRPC) using your chapter 5 ring with replication factor N=3 and tunable W/R.
- Gossip-based failure detection (heartbeat counters) and sloppy quorum + hinted handoff when a node is down.
- Anti-entropy with a Merkle tree comparison between replicas.

### Milestones
- [ ] Make `pytest 06-key-value-store` pass (vector clocks + Bloom filter + LSM engine).
- [ ] Add a WAL and prove crash recovery: kill -9 the process mid-write and restart.
- [ ] Run 3 nodes with N=3, W=2, R=2. Kill one node and show reads/writes still succeed.
- [ ] Partition the network (block a port) and produce a sibling conflict, then resolve it with vector clocks.
- [ ] Add Merkle-tree anti-entropy and show a revived node catches up.

### Starter files
- [`bloom.py`](bloom.py)
- [`lsm.py`](lsm.py)
- [`tests/test_kv.py`](tests/test_kv.py)
- [`vector_clock.py`](vector_clock.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 06-key-value-store
```

### Stretch goals
- [ ] Size-tiered vs leveled compaction and measure write amplification.
- [ ] Read repair on the read path.
- [ ] Run a Jepsen-style linearizability check with a simple history checker.

### Suggested stack
Python 3.11 (asyncio + aiohttp or FastAPI per node), stdlib only for the engine, pytest

## 5. Break it
- [ ] Set W=1, R=1, partition a node and read stale data.
- [ ] Kill -9 during a write and verify WAL recovery.
- [ ] Write from two partitioned sides and resolve the siblings.

## 6. Review
- Why does W + R > N give strong reads?
- What does a vector clock tell you that a timestamp can't?
- How does a Bloom filter speed up reads?
- What's hinted handoff for?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/06.%20Key-Value%20Store).

## Results
_Write your measurements, failure experiments and surprises here._
