# 02 · Back-of-the-Envelope Estimation

> Notes: [Back-of-the-Envelope Estimation](https://github.com/liquidslr/system-design-notes/tree/main/02.%20Back%20Of%20the%20Envelope%20Estimation) · Phase 0: Foundations · Suggested time: 1 day

## Goal
Build a small estimation toolkit you will reuse in every later chapter, and calibrate your intuition by measuring real latencies on your own machine.

## What you'll build
- `estimate.py`: helpers for QPS, peak QPS, storage over N years, bandwidth, and number of servers.
- A CLI that takes a YAML of assumptions (DAU, actions/user, payload size, retention) and prints a labelled estimate.
- `latency_bench.py`: measures L1-ish in-memory access, RAM read of 1 MB, SSD random read, local network round trip, and compares with the classic table.

## Key concepts exercised
- Powers of two
- Latency numbers
- Availability nines and downtime budgets
- QPS / peak QPS
- Storage and bandwidth estimation
- Labelling units

## Milestones
- [ ] Implement the functions in `estimate.py` until `pytest 02-back-of-envelope` passes.
- [ ] Write `assumptions/twitter.yaml` from the chapter and reproduce its numbers with the CLI.
- [ ] Run `latency_bench.py` and paste your results next to the textbook numbers.
- [ ] Add an estimate YAML for every later chapter before you build it (make it a habit).

## Stretch goals
- [ ] Add an availability calculator: serial vs parallel components, nines -> downtime/year.
- [ ] Plot cost estimates (S3 GB-month, egress) for the YouTube chapter.
- [ ] Add a cache sizing helper (working set x object size x overhead).

## Suggested stack
Python 3.11, PyYAML, pytest

## Starter files
- `estimate.py`
- `latency_bench.py`
- `tests/test_estimate.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 02-back-of-envelope
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
