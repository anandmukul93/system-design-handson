# 46 · Observability: Logs, Metrics, Traces & SLOs

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=46-observability)

**Concepts covered:** #58 Monitoring · #59 Logging · #60 Distributed Tracing · #61 Metrics · #62 Alerts · #63 SLOs · #64 SLIs · #65 Error Budgets · #66 Observability

## Goal
Know what your system is doing and whether users are happy: structured logs, metrics, distributed tracing with W3C trace context, SLIs and SLOs, error budgets and burn-rate alerts.

## 1. Concepts
### Observability
The ability to answer new questions about a running system from its outputs, without shipping new code. Built on three signals (logs, metrics, traces) tied together by shared ids and labels.

### Monitoring
Watching known signals against expectations: dashboards for the golden signals (latency, traffic, errors, saturation) and RED/USE methods.

### Logging
Event records. Make them structured (JSON with consistent keys), include trace and request ids, log at the right level, never log secrets, and sample noisy debug logs.

### Metrics
Cheap numeric time series (counters, gauges, histograms) aggregated over time. Watch label cardinality: user_id as a label can melt your TSDB.

### Distributed tracing
A trace follows one request across services as a tree of spans. Context propagates in headers (W3C `traceparent`: version-traceid-spanid-flags) so every service can attach its spans to the same trace.

### Alerts
Page humans only for user-visible symptoms that need action now; send everything else to tickets. Every alert needs a runbook.

### SLIs
Service level indicators: measured ratios of good events to total, e.g. requests under 300 ms / all requests.

### SLOs
Targets for SLIs over a window, e.g. 99.9% of requests succeed over 30 days. They define 'reliable enough' and drive prioritisation.

### Error budgets
1 - SLO is the failure you're allowed: 99.9% leaves 0.1%. Burn rate is how fast you spend it; multi-window burn-rate alerts (e.g. 14.4x over 1 h and 5 min) catch fast burns without paging on blips.

## 2. Trade-offs and optimizations
- Logs are rich but expensive; metrics are cheap but pre-aggregated; traces show causality but are sampled.
- Head sampling is simple; tail sampling keeps the interesting (slow/error) traces.
- SLOs slightly below what you achieve leave room to ship; 100% is never the right target.
- Alert on burn rate, not on raw error spikes.
- Exemplars link a metric bucket to a trace id.

## 3. Demo
A small microservice call graph handles live simulated traffic. Inject latency or errors into one service and watch a trace waterfall, structured log lines carrying the same trace id, the SLI chart and the error-budget burn-down, with burn-rate alerts firing at the right moment.

- **In the browser:** [46-observability on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=46-observability). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=46-observability>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `observability.py`: W3C traceparent parsing and child spans, a JSON log formatter, error budget accounting and a multi-window burn-rate alert.
- OpenTelemetry instrumentation of two FastAPI services exporting to Jaeger and Prometheus, plus a Grafana SLO dashboard.

### Milestones
- [ ] Make `pytest 46-observability` pass.
- [ ] Instrument two FastAPI services with OpenTelemetry and view a trace in Jaeger.
- [ ] Define an SLO for chapter 8's redirect endpoint and build the burn-rate alert in Prometheus.

### Starter files
- [`observability.py`](observability.py)
- [`tests/test_observability.py`](tests/test_observability.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 46-observability
```

### Stretch goals
- [ ] Tail-based sampling in the OpenTelemetry Collector.
- [ ] Continuous profiling (Pyroscope) linked from traces.
- [ ] Log pipelines with Vector and Loki.

### Suggested stack
OpenTelemetry, Jaeger, Prometheus, Grafana, FastAPI, pytest

## 5. Break it
- [ ] Add a user_id label to a metric and watch series count explode.
- [ ] Drop the trace header at one hop and see the trace split in two.
- [ ] Inject a 2% error rate and see which alert fires and when.

## 6. Review
- What's the difference between monitoring and observability?
- What does each part of a traceparent header mean?
- How much error budget does a 99.95% monthly SLO give you?
- Why use two windows for burn-rate alerts?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
