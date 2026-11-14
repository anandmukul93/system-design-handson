# 39 · Memory Leaks & Garbage Collection

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=39-memory-gc)

**Concepts covered:** #41 Memory Leaks · #42 Garbage Collection

## Goal
Understand how runtimes free memory and how services still leak it: reference counting vs mark-and-sweep, generational GC, and finding a leak from heap snapshots.

## 1. Concepts
### Garbage collection
The runtime frees objects nothing can reach. Reference counting frees immediately but can't collect cycles; tracing collectors (mark-and-sweep, copying) start from roots and free everything unmarked. Generational GCs collect young objects often because most die young. Pauses and CPU are the cost.

### Memory leaks
In a GC language a leak is memory that is still reachable but never used again: unbounded caches and maps, listeners never removed, growing queues, global registries, closures holding big objects. Find them by comparing heap snapshots and looking for types whose counts only grow.

## 2. Trade-offs and optimizations
- Bound every cache and queue (size or TTL); prefer LRU over a plain dict.
- Weak references let caches drop entries the program no longer uses.
- GC tuning: bigger young generation = fewer, longer minor GCs; pause-focused collectors (G1, ZGC, Go's) trade throughput for latency.
- Watch RSS and GC pause time as metrics; a slow upward sawtooth is a leak.
- Object pools reduce allocation rate but make leaks easier.

## 3. Demo
A heap you can draw: allocate objects, add references, make a cycle, drop roots and run either reference counting or mark-and-sweep to see what each frees. A second panel simulates a service with a leaky cache and shows memory and GC pauses climbing over time, then the fix.

- **In the browser:** [39-memory-gc on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=39-memory-gc). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=39-memory-gc>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `memory_gc.py`: a toy heap with reference counting and mark-and-sweep, and a leak detector over heap snapshots.
- A FastAPI service with a deliberate leak, found with `tracemalloc` snapshots and fixed.

### Milestones
- [ ] Make `pytest 39-memory-gc` pass.
- [ ] Write a leaky FastAPI endpoint (append every request to a global list) and find it with `tracemalloc.compare_to`.
- [ ] Plot `gc.get_stats()` and RSS under load before and after the fix.

### Starter files
- [`memory_gc.py`](memory_gc.py)
- [`tests/test_memory_gc.py`](tests/test_memory_gc.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 39-memory-gc
```

### Stretch goals
- [ ] Write a copying (semi-space) collector.
- [ ] Implement a tri-color incremental marker with a write barrier.
- [ ] Compare Go's GC pauses with Python's at the same allocation rate.

### Suggested stack
Python 3.11 (tracemalloc, gc), FastAPI, pytest

## 5. Break it
- [ ] Disable `gc` and create cycles; watch memory with reference counting alone.
- [ ] Run a container with a 256 MB memory limit and let the leak trigger the OOM killer.
- [ ] Create a 2 GB heap in Java with the default GC and measure pause times; switch to ZGC.

## 6. Review
- Why can't reference counting free a cycle?
- What's a leak in a garbage-collected language?
- Why are generational collectors effective?
- How do you find which type is leaking?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
