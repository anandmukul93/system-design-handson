# 28 · Stock Exchange

> Phase 5: Money and correctness · Suggested time: 2 weeks · Notes: [Stock Exchange](https://github.com/liquidslr/system-design-notes/tree/main/28.%20Stock%20Exchange) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=28-stock-exchange)

**Concepts covered:** #85 Failover

## Goal
Build a low-latency exchange core: order manager with risk checks, a sequencer, a price-time-priority matching engine, market data (L1/L2 and candlesticks), and deterministic replay from the event log.

## 1. Concepts
### Order book
Bids and asks are kept at price levels, each a FIFO queue, so the best price and earliest order match first.

### Matching engine
An incoming order matches against the opposite side while prices cross, producing fills; the remainder rests.

### Sequencer
Every inbound order and outbound event gets a sequence number, making the system a deterministic state machine.

### Determinism and replay
Replaying the sequenced log rebuilds the exact book, enabling hot-warm failover.

### Low latency
Single-threaded hot path, no locks or allocations, mmap'd event log and colocated market data.

## 2. Trade-offs and optimizations
- Single-threaded matching is simpler and faster than parallel matching with locks.
- Determinism forbids wall-clock and randomness in the engine.
- Market data fairness needs multicast or equal-latency distribution.

## 3. Demo
Place buy and sell orders (or start a random order flow) and watch the order book depth ladder update, fills print with price-time priority, candlesticks build, and a second engine replay the event log to the identical book.

- **In the browser:** [28-stock-exchange on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=28-stock-exchange). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`matching_engine.js`](demo/matching_engine.js), [`candles.js`](demo/candles.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=28-stock-exchange>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Order book per symbol with price levels as FIFO queues (doubly linked list / deque) and O(1) cancel by order ID.
- Matching engine for limit orders (stretch: market orders, IOC) with price-time priority and partial fills.
- Sequencer that stamps every inbound order and outbound execution with a sequence ID and appends to an event log (mmap file).
- Order manager with risk checks (max order size, available balance) and a client gateway over TCP (FIX-like text protocol).
- Market data publisher producing L2 depth snapshots and 1-minute candlesticks.
- Hot-warm failover: a second engine replays the event log and must reach the identical book.

### Milestones
- [ ] Make `pytest 28-stock-exchange` pass (order book matching + cancel + replay determinism).
- [ ] Add the sequencer + event log and replay into a second engine; diff the books.
- [ ] Benchmark orders/sec and p99 match latency; then profile and optimize the hot path.
- [ ] Publish L2 depth and candles; build a terminal UI that shows the book live.

### Starter files
- [`order_book.py`](order_book.py)
- [`tests/test_order_book.py`](tests/test_order_book.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 28-stock-exchange
```

### Stretch goals
- [ ] Rewrite the matching engine in Go or Rust and compare latency.
- [ ] Use Aeron-style UDP multicast for market data to multiple subscribers.
- [ ] Raft-based leader election for the matching engine cluster.

### Suggested stack
Python 3.11 (then Go/Rust for the hot path), asyncio TCP, mmap, pytest

## 5. Break it
- [ ] Add randomness to matching and watch replay diverge.
- [ ] Cancel orders at a hot price level and measure cost.
- [ ] Flood the engine with orders and look at queue depth.

## 6. Review
- What is price-time priority?
- Why does the sequencer make failover possible?
- Why is the matching engine single-threaded?
- What is in an L2 market data feed?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/28.%20Stock%20Exchange).

## Results
_Write your measurements, failure experiments and surprises here._
