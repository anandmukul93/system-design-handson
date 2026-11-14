# 34 · Replication, Sharding & Leader Election

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=34-replication-consensus)

**Concepts covered:** #30 Sharding · #31 Partitioning · #32 Replication · #33 Leader Election

## Goal
Understand how data is copied and split across machines and how a cluster agrees on a leader: hash vs range partitioning, read-your-writes over async replicas, and Raft-style elections.

## 1. Concepts
### Replication
Keep copies of data on several nodes for durability and read scale. Leader-follower is simplest; multi-leader and leaderless (Dynamo) trade conflict handling for availability. Sync replication waits for followers, async risks losing the last writes on failover.

### Sharding
Split data across machines by a shard key so each holds a fraction. Pick a key with high cardinality and even access; avoid cross-shard queries and transactions; plan resharding (consistent hashing, or many small virtual shards).

### Partitioning
Range partitioning keeps keys ordered (good for scans, prone to hot spots); hash partitioning spreads load (bad for range queries). Many systems combine them: hash for placement, range inside a partition.

### Leader election
A cluster must agree on exactly one leader per term. Raft: followers that miss heartbeats become candidates, bump the term and ask for votes; a node votes once per term and only for candidates whose log is at least as up to date; a majority wins.

## 2. Trade-offs and optimizations
- Majority quorums need 2f+1 nodes to survive f failures.
- Randomised election timeouts prevent split votes.
- Fencing tokens / terms stop a deposed leader from writing (see chapter 38).
- Hot shard? Split it, add a salt to the key, or cache it.
- Async replicas are cheap but readers need read-your-writes or monotonic-read routing.

## 3. Demo
A Raft election visualiser with five nodes: watch heartbeats, kill the leader, partition the cluster and see terms increase and a new leader win with a majority. A second panel shows keys landing on shards under hash vs range partitioning as you add hot keys.

- **In the browser:** [34-replication-consensus on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=34-replication-consensus). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`raft.js`](demo/raft.js), [`partitioning.js`](demo/partitioning.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=34-replication-consensus>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `replication.py`: Raft's RequestVote rules, majority size, hash and range partitioners, and a read-your-writes router for async replicas.
- A 3-node cluster using etcd (or your own Raft with a library) to elect a leader for your chapter 6 KV store.

### Milestones
- [ ] Make `pytest 34-replication-consensus` pass.
- [ ] Run a 3-node etcd cluster, kill the leader and time the election.
- [ ] Add leader election to your chapter 6 or chapter 19 cluster.

### Starter files
- [`replication.py`](replication.py)
- [`tests/test_replication.py`](tests/test_replication.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 34-replication-consensus
```

### Stretch goals
- [ ] Implement full Raft log replication (the paper's Figure 2).
- [ ] Online resharding: move a shard while serving traffic.
- [ ] Compare chain replication with primary-backup.

### Suggested stack
Python 3.11, etcd, pytest

## 5. Break it
- [ ] Partition a 5-node etcd cluster 2|3 and try writes on each side.
- [ ] Create a hot range partition with sequential keys and measure the imbalance.
- [ ] Fail over an async replica and count lost writes.

## 6. Review
- Why does a Raft node refuse to vote for a candidate with an older log?
- When is range partitioning a bad idea?
- What is read-your-writes and how do you route for it?
- How many nodes do you need to tolerate 2 failures?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
