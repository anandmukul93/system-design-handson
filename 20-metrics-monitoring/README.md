# 20 · Metrics Monitoring and Alerting System

> Notes: [Metrics Monitoring and Alerting System](https://github.com/liquidslr/system-design-notes/tree/main/20.%20Metrics%20Monitoring%20and%20Alerting%20System) · Phase 4: Data infrastructure · Suggested time: 1-2 weeks

## Goal
Build a small Prometheus/Datadog: agents push metrics through a queue into your own time-series store, with a query API, downsampling, alert rules and a Grafana dashboard.

## What you'll build
- Collection agent that samples host metrics (psutil) and pushes `name{labels} value ts` lines.
- Ingestion through Redpanda so bursts don't drop data; consumers write to storage.
- A time-series store: series keyed by name + sorted labels, in-memory head block + immutable compressed chunks on disk (delta-of-delta timestamps, XOR floats as a stretch).
- Query service: range query with label matchers, aggregations (avg/max/sum/rate) and step.
- Rollups: raw for 7 days, 1-minute for 30 days, 1-hour for 1 year.
- Alert manager: YAML rules (`expr > threshold for 5m`), dedupe and routing to the chapter 10 notification system.

## Key concepts exercised
- Pull vs push collection
- Time-series data model and cardinality
- Write-heavy storage, compression
- Downsampling and retention
- Query aggregations
- Alert evaluation, dedupe, routing

## Milestones
- [ ] Make `pytest 20-metrics-monitoring` pass (TSDB range + downsample + alert rule).
- [ ] Run 5 agents -> Redpanda -> your store; query with curl.
- [ ] Point Grafana at your query API (JSON datasource or a Prometheus-compatible endpoint).
- [ ] Fire an alert by running a CPU hog; route it to your notification system.

## Stretch goals
- [ ] Gorilla compression and measure bytes/sample.
- [ ] Expose a Prometheus `/metrics` endpoint from earlier chapters and scrape it (pull model).
- [ ] Cardinality limiter that rejects new series past a budget.

## Suggested stack
Python 3.11, Redpanda, FastAPI, Grafana, psutil, pytest

## Starter files
- `tests/test_tsdb.py`
- `tsdb.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 20-metrics-monitoring
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
