# 27 · Digital Wallet

> Phase 5: Money and correctness · Suggested time: 1-2 weeks · Notes: [Digital Wallet](https://github.com/liquidslr/system-design-notes/tree/main/27.%20%20Digital%20Wallet) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=27-digital-wallet)

**Concepts covered:** #17 Event-Driven Architecture · #18 Distributed Transactions · #19 Saga Pattern

## Goal
Build a wallet that moves money between accounts with an auditable event log: event sourcing with replayable state, snapshots, and a distributed transfer across shards using TC/C and Saga.

## 1. Concepts
### Event sourcing
Store every change as an immutable event; current state is the result of replaying them. You get an audit log and reproducibility.

### Commands vs events
Commands are requests that may be rejected after validation; events are facts that already happened.

### Snapshots
Periodically save state so recovery replays only recent events.

### Distributed transfers
Moving money across shards needs TC/C (try, confirm, cancel) or a saga with compensations.

## 2. Trade-offs and optimizations
- Event sourcing makes queries harder; use CQRS read models.
- Snapshots speed recovery at the cost of storage.
- TC/C holds reservations; sagas expose intermediate states.

## 3. Demo
Issue deposits and transfers and watch commands validate, events append to the log and balances update. Replay the log from scratch or from a snapshot to get the same state, and run a cross-shard transfer that fails midway and compensates.

- **In the browser:** [27-digital-wallet on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=27-digital-wallet). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`events.js`](demo/events.js), [`wallet.js`](demo/wallet.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=27-digital-wallet>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Command -> validate -> event -> apply state, with an append-only event store (file or Postgres) and deterministic replay.
- Snapshots every N events so restarts are fast.
- Account balances sharded across 3 "wallet nodes" by consistent hashing (chapter 5).
- Cross-shard transfer implemented twice: Try-Confirm/Cancel with a phase-status table, and a Saga with compensating actions.
- CQRS read model (balances + history) built from events and served by a query API.
- A load test that runs 100k random transfers and asserts total money is conserved.

### Milestones
- [ ] Make `pytest 27-digital-wallet` pass (event-sourced wallet with replay + snapshot).
- [ ] Persist events to disk and restart from snapshot + tail; time it at 1M events.
- [ ] Shard accounts across 3 processes and implement TC/C; kill the coordinator mid-transfer and recover.
- [ ] Implement the Saga version and compare failure handling.

### Starter files
- [`tests/test_wallet.py`](tests/test_wallet.py)
- [`wallet.py`](wallet.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 27-digital-wallet
```

### Stretch goals
- [ ] Raft-replicated event log (use a library like pysyncobj) for each shard.
- [ ] mmap-based event file for the high-performance variant in the chapter.
- [ ] Exactly-once commands via a request_id dedupe table.

### Suggested stack
Python 3.11, FastAPI, Postgres (or flat files), pytest

## 5. Break it
- [ ] Mutate state outside of events and see replay diverge.
- [ ] Replay without snapshots at 1M events.
- [ ] Fail the second leg of a cross-shard transfer.

## 6. Review
- Command vs event?
- Why must event handlers be deterministic?
- What do snapshots buy you?
- TC/C vs saga?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/27.%20%20Digital%20Wallet).

## Results
_Write your measurements, failure experiments and surprises here._
