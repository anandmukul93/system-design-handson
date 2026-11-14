# 26 · Payment System

> Phase 5: Money and correctness · Suggested time: 1-2 weeks · Notes: [Payment System](https://github.com/liquidslr/system-design-notes/tree/main/26.%20Payment%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=26-payment-system)

**Concepts covered:** #12 Retries · #14 Idempotency · #101 Webhooks

## Goal
Build a pay-in flow end to end: checkout -> payment service -> mock PSP with a hosted payment page and webhooks -> double-entry ledger -> wallet, plus retries, idempotency and nightly reconciliation.

## 1. Concepts
### Pay-in flow
Checkout -> payment service -> payment service provider (PSP) with a hosted payment page so card data never touches you.

### Idempotency
Every payment request carries a key so retries never double charge.

### Double-entry ledger
Every movement is recorded as a debit and a matching credit; balances always sum to zero.

### Retries and DLQ
Transient PSP failures retry with backoff; persistent failures go to a dead-letter queue.

### Reconciliation
Compare your ledger with the PSP's settlement file nightly to find mismatches.

## 2. Trade-offs and optimizations
- Sync PSP calls are simpler; async via webhooks scales and survives slow PSPs.
- Exactly-once = at-least-once + idempotency.
- Reconciliation is the last line of defence; automate it.

## 3. Demo
Run checkouts against a mock PSP that sometimes times out or fails. Watch the payment state machine, the idempotent retries, the double-entry ledger entries balancing, and a reconciliation report highlighting mismatches.

- **In the browser:** [26-payment-system on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=26-payment-system). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`psp.js`](demo/psp.js), [`ledger.js`](demo/ledger.js), [`payment_service.js`](demo/payment_service.js), [`reconciliation.js`](demo/reconciliation.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=26-payment-system>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- A mock PSP (separate FastAPI app) with a hosted payment page, a payment token/nonce, webhook callbacks, and configurable failures/delays.
- Payment service: payment_event and payment_order tables, an idempotency key on every request, a status state machine (NOT_STARTED -> EXECUTING -> SUCCESS/FAILED).
- Double-entry ledger where every transaction has balancing debit and credit entries.
- Wallet service updated from payment success events (via a queue, exactly-once via dedupe).
- Retry queue with backoff and dead-letter queue for failed payments.
- Reconciliation job that compares the PSP's settlement file with your ledger and reports mismatches.

### Milestones
- [ ] Make `pytest 26-payment-system` pass (ledger + idempotent payment service).
- [ ] Build the mock PSP and complete a checkout in the browser via the hosted page + webhook.
- [ ] Make the PSP fail 30% of the time; verify retries never double charge.
- [ ] Generate a settlement file with deliberate mismatches and catch them with reconciliation.

### Starter files
- [`payments.py`](payments.py)
- [`tests/test_payments.py`](tests/test_payments.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 26-payment-system
```

### Stretch goals
- [ ] Pay-out flow to sellers (scheduled batch).
- [ ] Handle a webhook arriving before the API response (out-of-order events).
- [ ] Multi-currency with an FX table and rounding rules (use Decimal / integer minor units).

### Suggested stack
Python 3.11, FastAPI, Postgres, Redpanda or Redis Streams, pytest

## 5. Break it
- [ ] Retry a timed-out payment without an idempotency key.
- [ ] Post an unbalanced ledger entry.
- [ ] Deliver the webhook before the API response.

## 6. Review
- Why use a hosted payment page?
- How does double-entry bookkeeping catch errors?
- How do you make retries safe?
- What does reconciliation find?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/26.%20Payment%20System).

## Results
_Write your measurements, failure experiments and surprises here._
