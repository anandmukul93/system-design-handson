# 21 · Ad Click Event Aggregation

> Phase 4: Data infrastructure · Suggested time: 1-2 weeks · Notes: [Ad Click Event Aggregation](https://github.com/liquidslr/system-design-notes/tree/main/21.%20Ad%20Click%20Event%20Aggregation) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=21-ad-click-aggregation)

**Concepts covered:** #31 Partitioning

## Goal
Build a streaming pipeline that counts ad clicks per minute and the top-N ads, with event-time windows, watermarks for late events, dedupe and exactly-once offsets, then reconcile against a batch job.

## 1. Concepts
### Streaming aggregation
Count clicks per ad per minute continuously as events arrive, instead of nightly batches.

### Event time vs processing time
Aggregate by when the click happened, not when it arrived, so delays don't move clicks between minutes.

### Windows and watermarks
Tumbling windows bucket by minute; the watermark (max event time minus allowed lateness) decides when a window is complete.

### Exactly-once and reconciliation
Dedupe by click id, commit offsets with results, and reconcile with a batch job over raw events.

## 2. Trade-offs and optimizations
- Longer allowed lateness = more correct, later results.
- Kappa (stream only) is simpler; Lambda keeps a batch path for correctness.
- Hot ads need partition splitting.

## 3. Demo
Click events stream in, some late, some duplicated. Watch tumbling windows fill, the watermark advance and close them, duplicates get dropped and late events get diverted, with a live top-N ads table per window.

- **In the browser:** [21-ad-click-aggregation on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=21-ad-click-aggregation). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=21-ad-click-aggregation>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Click event generator writing to Redpanda (with out-of-order and duplicate events on purpose).
- Aggregation service: tumbling 1-minute windows by event time, per `ad_id` counts and top-N per window, watermark to close windows, late events routed to a correction path.
- Dedupe by `click_id` within a window.
- Exactly-once-ish: commit Kafka offsets atomically with aggregated results (store offsets in the same DB transaction).
- Query API: `/ads/{id}/aggregated_count?from&to` and `/ads/popular_ads?count&window`.
- Nightly batch job that recomputes from raw events and reports diffs (reconciliation).

### Milestones
- [ ] Make `pytest 21-ad-click-aggregation` pass (window aggregator with watermark + dedupe + top-N).
- [ ] Wire generator -> Redpanda -> aggregator -> Postgres; query counts via the API.
- [ ] Kill the aggregator mid-stream and restart; verify no double counting.
- [ ] Run the batch reconciliation and explain any differences.

### Starter files
- [`aggregator.py`](aggregator.py)
- [`tests/test_aggregator.py`](tests/test_aggregator.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 21-ad-click-aggregation
```

### Stretch goals
- [ ] Sliding windows for top-N over the last 5 minutes.
- [ ] Use Apache Flink (PyFlink) and compare with your hand-rolled version.
- [ ] Filter by country/IP via star-schema pre-aggregation.

### Suggested stack
Python 3.11, Redpanda, Postgres, FastAPI, pytest (stretch: Flink)

## 5. Break it
- [ ] Set allowed lateness to 0 and count dropped late clicks.
- [ ] Restart the aggregator without committed offsets.
- [ ] Send every click to one ad and look at partition load.

## 6. Review
- Why aggregate on event time?
- What does a watermark decide?
- How do you avoid double counting after a restart?
- Why reconcile with a batch job?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/21.%20Ad%20Click%20Event%20Aggregation).

## Results
_Write your measurements, failure experiments and surprises here._
