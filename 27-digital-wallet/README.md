# 27 · Digital Wallet

> Notes: [Digital Wallet](https://github.com/liquidslr/system-design-notes/tree/main/27.%20%20Digital%20Wallet) · Phase 5: Money and correctness · Suggested time: 1-2 weeks

## Goal
Build a wallet that moves money between accounts with an auditable event log: event sourcing with replayable state, snapshots, and a distributed transfer across shards using TC/C and Saga.

## What you'll build
- Command -> validate -> event -> apply state, with an append-only event store (file or Postgres) and deterministic replay.
- Snapshots every N events so restarts are fast.
- Account balances sharded across 3 "wallet nodes" by consistent hashing (chapter 5).
- Cross-shard transfer implemented twice: Try-Confirm/Cancel with a phase-status table, and a Saga with compensating actions.
- CQRS read model (balances + history) built from events and served by a query API.
- A load test that runs 100k random transfers and asserts total money is conserved.

## Key concepts exercised
- Atomic cross-shard transfers
- 2PC vs TC/C vs Saga
- Event sourcing: commands, events, state, determinism
- Snapshots and replay
- CQRS
- Reproducibility and auditability

## Milestones
- [ ] Make `pytest 27-digital-wallet` pass (event-sourced wallet with replay + snapshot).
- [ ] Persist events to disk and restart from snapshot + tail; time it at 1M events.
- [ ] Shard accounts across 3 processes and implement TC/C; kill the coordinator mid-transfer and recover.
- [ ] Implement the Saga version and compare failure handling.

## Stretch goals
- [ ] Raft-replicated event log (use a library like pysyncobj) for each shard.
- [ ] mmap-based event file for the high-performance variant in the chapter.
- [ ] Exactly-once commands via a request_id dedupe table.

## Suggested stack
Python 3.11, FastAPI, Postgres (or flat files), pytest

## Starter files
- `tests/test_wallet.py`
- `wallet.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 27-digital-wallet
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
