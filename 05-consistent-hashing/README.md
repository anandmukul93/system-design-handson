# 05 · Design Consistent Hashing

> Phase 1: Building blocks · Suggested time: 2 days · Notes: [Design Consistent Hashing](https://github.com/liquidslr/system-design-notes/tree/main/05.%20Consistent%20Hashing) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=05-consistent-hashing)

**Concepts covered:** #30 Sharding

## Goal
Build a consistent hash ring with virtual nodes and prove, with numbers, that it moves far fewer keys than `hash % N`.

## 1. Concepts
### The rehashing problem
With hash(key) % N, changing N remaps almost every key, which empties caches and moves data.

### Hash ring
Servers and keys hash onto the same circle; a key belongs to the first server clockwise. Adding a server only takes keys from its neighbour.

### Virtual nodes
Each server appears many times on the ring, which evens out load and spreads a failed server's keys across many others.

### Replica placement
Walk clockwise and pick the next N distinct physical servers to store replicas.

## 2. Trade-offs and optimizations
- More vnodes = better balance but more memory and slower membership changes.
- Jump hash is faster and perfectly balanced but doesn't support arbitrary removal.
- Rendezvous hashing is simple and good for small clusters.

## 3. Demo
A ring you can play with: add and remove servers, change the number of virtual nodes, and watch keys move. Counters show how many keys moved compared with modulo hashing and how evenly load is spread.

- **In the browser:** [05-consistent-hashing on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=05-consistent-hashing). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`hashing.js`](demo/hashing.js), [`modulo_router.js`](demo/modulo_router.js), [`hash_ring.js`](demo/hash_ring.js), [`measure.js`](demo/measure.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=05-consistent-hashing>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- A `HashRing` with add/remove node, virtual nodes, `get_node(key)` and `get_nodes(key, n)` for replica placement.
- An experiment script that distributes 1M keys across 10 servers and reports: std-dev of load vs number of vnodes, and % of keys moved when adding or removing a server (ring vs modulo).
- A chart (matplotlib) of load std-dev vs vnode count.

### Milestones
- [ ] Make `pytest 05-consistent-hashing` pass.
- [ ] Run `experiment.py` and record the key-movement numbers (expect ~1/N for the ring, ~(N-1)/N for modulo).
- [ ] Plot std-dev for 1, 10, 100, 500 vnodes per server.

### Starter files
- [`experiment.py`](experiment.py)
- [`hash_ring.py`](hash_ring.py)
- [`tests/test_hash_ring.py`](tests/test_hash_ring.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 05-consistent-hashing && python 05-consistent-hashing/experiment.py
```

### Stretch goals
- [ ] Weighted nodes (more vnodes for bigger servers).
- [ ] Implement jump consistent hash and rendezvous (HRW) hashing and compare.
- [ ] Reuse this ring in chapter 6 (KV store) and chapter 17 (Redis pub/sub sharding).

### Suggested stack
Python 3.11 (bisect, hashlib), matplotlib, pytest

## 5. Break it
- [ ] Use 1 vnode per server and measure the load imbalance.
- [ ] Remove a server and count keys moved vs modulo.
- [ ] Use a poor hash function (first letter) and watch hot spots.

## 6. Review
- Why does modulo hashing break on resize?
- What do virtual nodes fix?
- How many keys move when you add the 11th server?
- Where else in this course is the ring reused?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/05.%20Consistent%20Hashing).

## Results
_Write your measurements, failure experiments and surprises here._
