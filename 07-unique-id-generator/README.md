# 07 · Design a Unique ID Generator

> Phase 1: Building blocks · Suggested time: 2 days · Notes: [Design a Unique ID Generator](https://github.com/liquidslr/system-design-notes/tree/main/07.%20Unique-Id%20Generator) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=07-unique-id-generator)

**Concepts covered:** #43 Thread Safety · #96 Clock Skew

## Goal
Build a Snowflake-style 64-bit ID service and stress it for uniqueness, ordering and clock skew, then compare against UUIDs and a ticket server.

## 1. Concepts
### Unique ID requirements
IDs must be unique, roughly time-ordered, numeric, 64-bit and generated at high rate without coordination.

### Snowflake
41 bits of milliseconds since an epoch, 10 bits of machine identity and 12 bits of sequence gives 4096 IDs per ms per machine, sortable by time.

### Alternatives
UUIDs need no coordination but are 128-bit and random (bad index locality); ticket servers are simple but a bottleneck; multi-master increments break ordering across servers.

### Clock issues
If the clock goes backwards, a Snowflake generator could repeat IDs; it must wait or fail.

## 2. Trade-offs and optimizations
- More timestamp bits = longer lifetime; more sequence bits = more IDs per ms.
- Time-ordered IDs make B-tree inserts sequential and fast.
- Machine IDs need assignment (config, ZooKeeper/etcd leases).

## 3. Demo
Generate IDs from several simulated machines and see each ID broken into timestamp, datacenter, machine and sequence bits. Speed up the request rate to overflow the sequence, or push a machine's clock backwards and watch the generator react.

- **In the browser:** [07-unique-id-generator on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=07-unique-id-generator). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`snowflake.js`](demo/snowflake.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=07-unique-id-generator>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- A `Snowflake` generator: 1 sign bit, 41-bit ms timestamp from a custom epoch, 5-bit datacenter, 5-bit machine, 12-bit sequence.
- A `parse(id)` function that recovers the fields.
- A tiny HTTP ID service (FastAPI) and a multi-process stress test checking for duplicates.
- Baselines: UUID4 and a Postgres/Redis `INCR` ticket server, measured for throughput and index-insert speed in Postgres.

### Milestones
- [ ] Make `pytest 07-unique-id-generator` pass.
- [ ] Run 8 processes with different machine IDs generating 1M IDs each; assert zero duplicates.
- [ ] Benchmark inserting 1M UUID4 vs Snowflake primary keys into Postgres and explain the difference (B-tree locality).

### Starter files
- [`snowflake.py`](snowflake.py)
- [`tests/test_snowflake.py`](tests/test_snowflake.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 07-unique-id-generator
```

### Stretch goals
- [ ] Lease machine IDs from Redis/etcd so containers don't need static config.
- [ ] Implement ULID / UUIDv7 and compare.
- [ ] Tune bit lengths for a low-concurrency, long-lifetime system.

### Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## 5. Break it
- [ ] Give two machines the same machine ID and find duplicates.
- [ ] Move the clock back 5 ms during generation.
- [ ] Insert 1M UUID4 vs Snowflake keys into Postgres and compare time.

## 6. Review
- Lay out the 64 bits of a Snowflake ID.
- What happens when 4097 IDs are needed in one millisecond?
- Why are UUID4 primary keys slow in B-trees?
- How do you assign machine IDs safely?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/07.%20Unique-Id%20Generator).

## Results
_Write your measurements, failure experiments and surprises here._
