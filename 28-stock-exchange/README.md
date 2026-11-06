# 28 · Stock Exchange

> Notes: [Stock Exchange](https://github.com/liquidslr/system-design-notes/tree/main/28.%20Stock%20Exchange) · Phase 5: Money and correctness · Suggested time: 2 weeks

## Goal
Build a low-latency exchange core: order manager with risk checks, a sequencer, a price-time-priority matching engine, market data (L1/L2 and candlesticks), and deterministic replay from the event log.

## What you'll build
- Order book per symbol with price levels as FIFO queues (doubly linked list / deque) and O(1) cancel by order ID.
- Matching engine for limit orders (stretch: market orders, IOC) with price-time priority and partial fills.
- Sequencer that stamps every inbound order and outbound execution with a sequence ID and appends to an event log (mmap file).
- Order manager with risk checks (max order size, available balance) and a client gateway over TCP (FIX-like text protocol).
- Market data publisher producing L2 depth snapshots and 1-minute candlesticks.
- Hot-warm failover: a second engine replays the event log and must reach the identical book.

## Key concepts exercised
- Order book data structures
- Price-time priority matching
- Sequencer and event sourcing
- Determinism and replay
- Latency: single-threaded hot path, avoiding allocations, mmap
- Market data, multicast fairness
- Hot-warm failover

## Milestones
- [ ] Make `pytest 28-stock-exchange` pass (order book matching + cancel + replay determinism).
- [ ] Add the sequencer + event log and replay into a second engine; diff the books.
- [ ] Benchmark orders/sec and p99 match latency; then profile and optimize the hot path.
- [ ] Publish L2 depth and candles; build a terminal UI that shows the book live.

## Stretch goals
- [ ] Rewrite the matching engine in Go or Rust and compare latency.
- [ ] Use Aeron-style UDP multicast for market data to multiple subscribers.
- [ ] Raft-based leader election for the matching engine cluster.

## Suggested stack
Python 3.11 (then Go/Rust for the hot path), asyncio TCP, mmap, pytest

## Starter files
- `order_book.py`
- `tests/test_order_book.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 28-stock-exchange
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
