# 02 · Back-of-the-Envelope Estimation

> Phase 0: Foundations · Suggested time: 1 day · Notes: [Back-of-the-Envelope Estimation](https://github.com/liquidslr/system-design-notes/tree/main/02.%20Back%20Of%20the%20Envelope%20Estimation) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=02-back-of-envelope)

**Concepts covered:** Foundations for the rest of the course

## Goal
Build a small estimation toolkit you will reuse in every later chapter, and calibrate your intuition by measuring real latencies on your own machine.

## 1. Concepts
### Powers of two and units
Know the byte ladder (KB, MB, GB, TB, PB) and keep units on every number so mistakes are visible.

### Latency numbers
Memory is ~100 ns, SSD random read ~100 us, a datacenter round trip ~0.5 ms, cross-continent ~150 ms. Orders of magnitude matter more than exact values.

### Availability nines
99.9% allows ~8.8 hours of downtime a year, 99.99% ~53 minutes. Serial dependencies multiply their availabilities.

### QPS, storage and bandwidth
QPS = DAU x actions per day / 86,400, peak is 2-10x average. Storage = items/day x size x retention.

## 2. Trade-offs and optimizations
- Round aggressively: the goal is the right order of magnitude in two minutes, not precision.
- State assumptions out loud; the interviewer cares about the reasoning.
- Estimate peak, not average, when sizing capacity.

## 3. Demo
An estimation calculator with sliders for DAU, actions per user, payload size, retention and peak factor that shows QPS, storage and bandwidth with units, plus an interactive latency ladder that animates how long each operation takes relative to the others.

- **In the browser:** [02-back-of-envelope on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=02-back-of-envelope). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`estimate.js`](demo/estimate.js), [`availability.js`](demo/availability.js), [`latency_numbers.js`](demo/latency_numbers.js), [`format.js`](demo/format.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=02-back-of-envelope>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `estimate.py`: helpers for QPS, peak QPS, storage over N years, bandwidth, and number of servers.
- A CLI that takes a YAML of assumptions (DAU, actions/user, payload size, retention) and prints a labelled estimate.
- `latency_bench.py`: measures L1-ish in-memory access, RAM read of 1 MB, SSD random read, local network round trip, and compares with the classic table.

### Milestones
- [ ] Implement the functions in `estimate.py` until `pytest 02-back-of-envelope` passes.
- [ ] Write `assumptions/twitter.yaml` from the chapter and reproduce its numbers with the CLI.
- [ ] Run `latency_bench.py` and paste your results next to the textbook numbers.
- [ ] Add an estimate YAML for every later chapter before you build it (make it a habit).

### Starter files
- [`estimate.py`](estimate.py)
- [`latency_bench.py`](latency_bench.py)
- [`tests/test_estimate.py`](tests/test_estimate.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 02-back-of-envelope
```

### Stretch goals
- [ ] Add an availability calculator: serial vs parallel components, nines -> downtime/year.
- [ ] Plot cost estimates (S3 GB-month, egress) for the YouTube chapter.
- [ ] Add a cache sizing helper (working set x object size x overhead).

### Suggested stack
Python 3.11, PyYAML, pytest

## 5. Break it
- [ ] Forget the peak factor and size a system for the average; see how often it would be overloaded.
- [ ] Mix up bits and bytes in a bandwidth estimate and find the 8x error.
- [ ] Compare your measured latencies with the textbook numbers and explain the gaps.

## 6. Review
- Estimate QPS for 100M DAU making 5 requests a day.
- How much downtime does 99.95% allow per month?
- Why is a cross-region call so much slower than a disk read?
- What's your storage estimate for 5 years of tweets?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/02.%20Back%20Of%20the%20Envelope%20Estimation).

## Results
_Write your measurements, failure experiments and surprises here._
