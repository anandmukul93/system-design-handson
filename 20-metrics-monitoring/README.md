# 20 · Metrics Monitoring and Alerting System

> Phase 4: Data infrastructure · Suggested time: 1-2 weeks · Notes: [Metrics Monitoring and Alerting System](https://github.com/liquidslr/system-design-notes/tree/main/20.%20Metrics%20Monitoring%20and%20Alerting%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=20-metrics-monitoring)

**Concepts covered:** #58 Monitoring · #61 Metrics · #62 Alerts

## Goal
Build a small Prometheus/Datadog: agents push metrics through a queue into your own time-series store, with a query API, downsampling, alert rules and a Grafana dashboard.

## 1. Concepts
### Time-series data model
A metric name plus labels identifies a series of (timestamp, value) points; label cardinality decides cost.

### Collection: push vs pull
Pull (Prometheus scrapes) makes it easy to detect dead targets; push suits short-lived jobs and firewalls.

### Storage and downsampling
Recent data at full resolution, older data rolled up; delta-of-delta and XOR compression make samples tiny.

### Alerting
Rules evaluate queries periodically; alerts must hold for a duration, get deduplicated and routed to the right people.

## 2. Trade-offs and optimizations
- Raw retention vs storage cost: keep raw briefly, rollups longer.
- High-cardinality labels make queries and storage explode.
- Alert 'for' duration trades detection speed for false positives.

## 3. Demo
Live metrics stream from simulated hosts into a chart. Write a query with label filters and aggregation, change the downsampling step, and create an alert rule with a threshold and 'for' duration, then run a CPU spike and watch it go pending and then fire.

- **In the browser:** [20-metrics-monitoring on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=20-metrics-monitoring). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`tsdb.js`](demo/tsdb.js), [`alert_rule.js`](demo/alert_rule.js), [`hosts.js`](demo/hosts.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=20-metrics-monitoring>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Collection agent that samples host metrics (psutil) and pushes `name{labels} value ts` lines.
- Ingestion through Redpanda so bursts don't drop data; consumers write to storage.
- A time-series store: series keyed by name + sorted labels, in-memory head block + immutable compressed chunks on disk (delta-of-delta timestamps, XOR floats as a stretch).
- Query service: range query with label matchers, aggregations (avg/max/sum/rate) and step.
- Rollups: raw for 7 days, 1-minute for 30 days, 1-hour for 1 year.
- Alert manager: YAML rules (`expr > threshold for 5m`), dedupe and routing to the chapter 10 notification system.

### Milestones
- [ ] Make `pytest 20-metrics-monitoring` pass (TSDB range + downsample + alert rule).
- [ ] Run 5 agents -> Redpanda -> your store; query with curl.
- [ ] Point Grafana at your query API (JSON datasource or a Prometheus-compatible endpoint).
- [ ] Fire an alert by running a CPU hog; route it to your notification system.

### Starter files
- [`tests/test_tsdb.py`](tests/test_tsdb.py)
- [`tsdb.py`](tsdb.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 20-metrics-monitoring
```

### Stretch goals
- [ ] Gorilla compression and measure bytes/sample.
- [ ] Expose a Prometheus `/metrics` endpoint from earlier chapters and scrape it (pull model).
- [ ] Cardinality limiter that rejects new series past a budget.

### Suggested stack
Python 3.11, Redpanda, FastAPI, Grafana, psutil, pytest

## 5. Break it
- [ ] Add a per-user label and watch series count explode.
- [ ] Set 'for: 0s' and count noisy alerts.
- [ ] Stop an agent and see how push vs pull notice it.

## 6. Review
- Why does label cardinality matter?
- Push vs pull collection?
- Why downsample old data?
- What does the 'for' clause on an alert do?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/20.%20Metrics%20Monitoring%20and%20Alerting%20System).

## Results
_Write your measurements, failure experiments and surprises here._
