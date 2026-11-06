# 07 · Design a Unique ID Generator

> Notes: [Design a Unique ID Generator](https://github.com/liquidslr/system-design-notes/tree/main/07.%20Unique-Id%20Generator) · Phase 1: Building blocks · Suggested time: 2 days

## Goal
Build a Snowflake-style 64-bit ID service and stress it for uniqueness, ordering and clock skew, then compare against UUIDs and a ticket server.

## What you'll build
- A `Snowflake` generator: 1 sign bit, 41-bit ms timestamp from a custom epoch, 5-bit datacenter, 5-bit machine, 12-bit sequence.
- A `parse(id)` function that recovers the fields.
- A tiny HTTP ID service (FastAPI) and a multi-process stress test checking for duplicates.
- Baselines: UUID4 and a Postgres/Redis `INCR` ticket server, measured for throughput and index-insert speed in Postgres.

## Key concepts exercised
- Snowflake layout
- Sequence overflow within a millisecond
- Clock moving backwards and NTP
- Time-sortable IDs
- Trade-offs of UUID vs ticket server vs multi-master

## Milestones
- [ ] Make `pytest 07-unique-id-generator` pass.
- [ ] Run 8 processes with different machine IDs generating 1M IDs each; assert zero duplicates.
- [ ] Benchmark inserting 1M UUID4 vs Snowflake primary keys into Postgres and explain the difference (B-tree locality).

## Stretch goals
- [ ] Lease machine IDs from Redis/etcd so containers don't need static config.
- [ ] Implement ULID / UUIDv7 and compare.
- [ ] Tune bit lengths for a low-concurrency, long-lifetime system.

## Suggested stack
Python 3.11, FastAPI, Postgres, Redis, pytest

## Starter files
- `snowflake.py`
- `tests/test_snowflake.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 07-unique-id-generator
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
