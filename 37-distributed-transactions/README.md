# 37 · Distributed Transactions: 2PC, Sagas, Outbox & Idempotency

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=37-distributed-transactions)

**Concepts covered:** #14 Idempotency · #18 Distributed Transactions · #19 Saga Pattern

## Goal
Keep data consistent across services without a single database transaction: two-phase commit, orchestrated sagas with compensations, the transactional outbox and idempotency keys.

## 1. Concepts
### Distributed transactions
An operation that must change state in several independent systems all-or-nothing. Two-phase commit does it with a coordinator: every participant votes in a prepare phase, then all commit or all abort. It's simple but blocking: a crashed coordinator leaves participants holding locks.

### Saga pattern
Break the transaction into local steps, each with a compensating action. Run steps in order; if one fails, run the compensations of the completed steps in reverse. Orchestrated sagas have a central coordinator; choreographed ones react to each other's events.

### Transactional outbox
To change your DB and publish an event without a distributed transaction, write the event into an outbox table in the same local transaction, and have a relay publish unsent rows. This gives at-least-once publishing.

### Idempotency
Retries are inevitable, so the same request must have the same effect once. Clients send an idempotency key; the server stores key -> result and replays the stored result, and rejects the same key with a different payload.

## 2. Trade-offs and optimizations
- 2PC gives atomicity but blocks on coordinator failure and holds locks across the network.
- Sagas are non-blocking but intermediate states are visible: design for it (e.g. 'pending' orders).
- Compensations must themselves be idempotent and retryable.
- Outbox + idempotent consumers = effectively-once processing.
- Expire idempotency keys after a window that covers your clients' retry horizon.

## 3. Demo
Book a trip across three services (flight, hotel, car). Toggle which service fails and at which step, and watch 2PC abort everything vs the saga running compensations in reverse. A second panel shows the outbox relay publishing events, crashing, and resending without losing any.

- **In the browser:** [37-distributed-transactions on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=37-distributed-transactions). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`two_phase_commit.js`](demo/two_phase_commit.js), [`saga.js`](demo/saga.js), [`outbox.js`](demo/outbox.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=37-distributed-transactions>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `dist_tx.py`: a 2PC coordinator, a saga orchestrator with reverse compensations, an outbox with a relay, and an idempotency store that detects key reuse with a different payload.
- A three-service trip booking on FastAPI + Postgres using an outbox table and Redpanda.

### Milestones
- [ ] Make `pytest 37-distributed-transactions` pass.
- [ ] Implement the trip booking saga across 3 FastAPI services.
- [ ] Add an outbox table and a relay process; kill the relay mid-batch.

### Starter files
- [`dist_tx.py`](dist_tx.py)
- [`tests/test_dist_tx.py`](tests/test_dist_tx.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 37-distributed-transactions
```

### Stretch goals
- [ ] Choreographed saga using events instead of an orchestrator.
- [ ] Change data capture (Debezium) instead of an outbox relay.
- [ ] Use Temporal to run the saga as a durable workflow.

### Suggested stack
Python 3.11, FastAPI, Postgres, Redpanda, pytest

## 5. Break it
- [ ] Crash the 2PC coordinator after prepare and observe the stuck participants.
- [ ] Fail the last saga step and confirm every compensation ran exactly once.
- [ ] Send the same payment request twice concurrently with the same idempotency key.

## 6. Review
- Why is 2PC called a blocking protocol?
- What must be true of a compensating action?
- What problem does the outbox solve that 'write DB then publish' doesn't?
- Why reject a reused idempotency key with a different body?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
