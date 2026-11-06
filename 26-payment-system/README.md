# 26 · Payment System

> Notes: [Payment System](https://github.com/liquidslr/system-design-notes/tree/main/26.%20Payment%20System) · Phase 5: Money and correctness · Suggested time: 1-2 weeks

## Goal
Build a pay-in flow end to end: checkout -> payment service -> mock PSP with a hosted payment page and webhooks -> double-entry ledger -> wallet, plus retries, idempotency and nightly reconciliation.

## What you'll build
- A mock PSP (separate FastAPI app) with a hosted payment page, a payment token/nonce, webhook callbacks, and configurable failures/delays.
- Payment service: payment_event and payment_order tables, an idempotency key on every request, a status state machine (NOT_STARTED -> EXECUTING -> SUCCESS/FAILED).
- Double-entry ledger where every transaction has balancing debit and credit entries.
- Wallet service updated from payment success events (via a queue, exactly-once via dedupe).
- Retry queue with backoff and dead-letter queue for failed payments.
- Reconciliation job that compares the PSP's settlement file with your ledger and reports mismatches.

## Key concepts exercised
- Pay-in vs pay-out
- PSP integration and hosted payment page
- Idempotency keys
- Double-entry bookkeeping
- Retries, DLQ, exactly-once = at-least-once + idempotency
- Reconciliation
- Sync vs async communication

## Milestones
- [ ] Make `pytest 26-payment-system` pass (ledger + idempotent payment service).
- [ ] Build the mock PSP and complete a checkout in the browser via the hosted page + webhook.
- [ ] Make the PSP fail 30% of the time; verify retries never double charge.
- [ ] Generate a settlement file with deliberate mismatches and catch them with reconciliation.

## Stretch goals
- [ ] Pay-out flow to sellers (scheduled batch).
- [ ] Handle a webhook arriving before the API response (out-of-order events).
- [ ] Multi-currency with an FX table and rounding rules (use Decimal / integer minor units).

## Suggested stack
Python 3.11, FastAPI, Postgres, Redpanda or Redis Streams, pytest

## Starter files
- `payments.py`
- `tests/test_payments.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 26-payment-system
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
