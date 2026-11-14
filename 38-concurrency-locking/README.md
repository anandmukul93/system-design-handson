# 38 · Concurrency & Locking

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=38-concurrency-locking)

**Concepts covered:** #36 Optimistic Locking · #37 Pessimistic Locking · #38 Distributed Locks · #39 Race Conditions · #40 Deadlocks · #43 Thread Safety

## Goal
See race conditions and deadlocks happen, then prevent them: thread-safe code, lock ordering, deadlock detection, optimistic vs pessimistic locking, and distributed locks with leases and fencing tokens.

## 1. Concepts
### Race conditions
When the outcome depends on timing between threads or processes. The classic: two threads read a counter, both add one, both write; one increment is lost. Check-then-act (`if not exists: create`) is the same bug across services.

### Thread safety
Code is thread-safe if it stays correct under concurrent calls: protect shared mutable state with locks, use atomic operations, or avoid sharing (immutability, message passing, per-thread state).

### Deadlocks
Two or more parties each hold a lock the other needs. All four Coffman conditions must hold; break one: lock ordering (always acquire in a global order), timeouts, or detection by finding a cycle in the wait-for graph.

### Optimistic locking
Read with a version, write with `WHERE version = ?`; if someone else won, retry. No locks held, great when conflicts are rare.

### Pessimistic locking
Take the lock first (`SELECT ... FOR UPDATE`) so others wait. Simpler under heavy contention, but holds resources and can deadlock.

### Distributed locks
A lock shared by processes on different machines (Redis, etcd, ZooKeeper). It must expire (lease) so a crashed holder doesn't block forever, which means a paused holder can wake up after expiry still thinking it holds the lock. Fencing tokens fix this: every grant gets a higher number and storage rejects writes with an older one.

## 2. Trade-offs and optimizations
- Optimistic wins with low contention; pessimistic with high contention or expensive retries.
- Prefer a single atomic operation (`UPDATE ... SET n = n + 1`, Redis INCR) over a lock when you can.
- Lease length trades availability after a crash against the risk window of a paused holder.
- Redlock is debated; for correctness use a consensus store (etcd/ZooKeeper) plus fencing.
- Keep critical sections short and never call the network while holding a local lock.

## 3. Demo
Watch threads race on a shared counter with and without a lock; run the dining philosophers and see a deadlock form in the wait-for graph, then fix it with lock ordering; and replay the classic distributed-lock failure where a GC pause lets two clients write, then turn on fencing tokens.

- **In the browser:** [38-concurrency-locking on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=38-concurrency-locking). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`counter_race.js`](demo/counter_race.js), [`philosophers.js`](demo/philosophers.js), [`fencing.js`](demo/fencing.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=38-concurrency-locking>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `concurrency.py`: a thread-safe counter, bank transfers with lock ordering, deadlock detection on a wait-for graph, a lease lock with fencing tokens, and a fenced storage that rejects stale writers.
- A Redis or etcd lease lock used by two worker processes writing to Postgres with a fencing column.

### Milestones
- [ ] Make `pytest 38-concurrency-locking` pass.
- [ ] Reproduce a lost update in Postgres with two sessions, then fix it three ways: atomic UPDATE, optimistic version, FOR UPDATE.
- [ ] Build an etcd lease lock and add fencing to the writes.

### Starter files
- [`concurrency.py`](concurrency.py)
- [`tests/test_concurrency.py`](tests/test_concurrency.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 38-concurrency-locking
```

### Stretch goals
- [ ] Lock-free counter with compare-and-swap in Go or Rust.
- [ ] Read the 'How to do distributed locking' essay by Martin Kleppmann and test Redlock's assumptions.
- [ ] Detect deadlocks across services with a timeout-based approach.

### Suggested stack
Python 3.11 (threading), Postgres, Redis or etcd, pytest

## 5. Break it
- [ ] Remove the lock from the counter and run 8 threads x 100k increments.
- [ ] Make two transactions lock rows in opposite order and read Postgres's deadlock error.
- [ ] SIGSTOP a lock holder past its lease and see the second holder's write rejected by fencing.

## 6. Review
- Why isn't `if not exists: insert` safe?
- Name the four Coffman conditions and which one lock ordering breaks.
- Why does a lease-based lock need fencing tokens?
- When would you pick optimistic over pessimistic locking?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
