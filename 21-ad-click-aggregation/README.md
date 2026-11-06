# 21 · Ad Click Event Aggregation

> Notes: [Ad Click Event Aggregation](https://github.com/liquidslr/system-design-notes/tree/main/21.%20Ad%20Click%20Event%20Aggregation) · Phase 4: Data infrastructure · Suggested time: 1-2 weeks

## Goal
Build a streaming pipeline that counts ad clicks per minute and the top-N ads, with event-time windows, watermarks for late events, dedupe and exactly-once offsets, then reconcile against a batch job.

## What you'll build
- Click event generator writing to Redpanda (with out-of-order and duplicate events on purpose).
- Aggregation service: tumbling 1-minute windows by event time, per `ad_id` counts and top-N per window, watermark to close windows, late events routed to a correction path.
- Dedupe by `click_id` within a window.
- Exactly-once-ish: commit Kafka offsets atomically with aggregated results (store offsets in the same DB transaction).
- Query API: `/ads/{id}/aggregated_count?from&to` and `/ads/popular_ads?count&window`.
- Nightly batch job that recomputes from raw events and reports diffs (reconciliation).

## Key concepts exercised
- Lambda vs Kappa architecture
- Event time vs processing time
- Tumbling/sliding windows, watermarks
- Delivery guarantees and dedupe
- Hotspots and partitioning by ad_id
- Reconciliation

## Milestones
- [ ] Make `pytest 21-ad-click-aggregation` pass (window aggregator with watermark + dedupe + top-N).
- [ ] Wire generator -> Redpanda -> aggregator -> Postgres; query counts via the API.
- [ ] Kill the aggregator mid-stream and restart; verify no double counting.
- [ ] Run the batch reconciliation and explain any differences.

## Stretch goals
- [ ] Sliding windows for top-N over the last 5 minutes.
- [ ] Use Apache Flink (PyFlink) and compare with your hand-rolled version.
- [ ] Filter by country/IP via star-schema pre-aggregation.

## Suggested stack
Python 3.11, Redpanda, Postgres, FastAPI, pytest (stretch: Flink)

## Starter files
- `aggregator.py`
- `tests/test_aggregator.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 21-ad-click-aggregation
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
