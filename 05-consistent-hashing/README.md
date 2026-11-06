# 05 · Design Consistent Hashing

> Notes: [Design Consistent Hashing](https://github.com/liquidslr/system-design-notes/tree/main/05.%20Consistent%20Hashing) · Phase 1: Building blocks · Suggested time: 2 days

## Goal
Build a consistent hash ring with virtual nodes and prove, with numbers, that it moves far fewer keys than `hash % N`.

## What you'll build
- A `HashRing` with add/remove node, virtual nodes, `get_node(key)` and `get_nodes(key, n)` for replica placement.
- An experiment script that distributes 1M keys across 10 servers and reports: std-dev of load vs number of vnodes, and % of keys moved when adding or removing a server (ring vs modulo).
- A chart (matplotlib) of load std-dev vs vnode count.

## Key concepts exercised
- The rehashing problem
- Hash space and ring
- Virtual nodes and load balance
- Affected key ranges
- Replica placement on distinct physical nodes

## Milestones
- [ ] Make `pytest 05-consistent-hashing` pass.
- [ ] Run `experiment.py` and record the key-movement numbers (expect ~1/N for the ring, ~(N-1)/N for modulo).
- [ ] Plot std-dev for 1, 10, 100, 500 vnodes per server.

## Stretch goals
- [ ] Weighted nodes (more vnodes for bigger servers).
- [ ] Implement jump consistent hash and rendezvous (HRW) hashing and compare.
- [ ] Reuse this ring in chapter 6 (KV store) and chapter 17 (Redis pub/sub sharding).

## Suggested stack
Python 3.11 (bisect, hashlib), matplotlib, pytest

## Starter files
- `experiment.py`
- `hash_ring.py`
- `tests/test_hash_ring.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 05-consistent-hashing && python 05-consistent-hashing/experiment.py
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
