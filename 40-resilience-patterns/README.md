# 40 · Resilience Patterns

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=40-resilience-patterns)

**Concepts covered:** #10 Circuit Breakers · #11 Timeouts · #12 Retries · #13 Exponential Backoff · #44 Backpressure

## Goal
Make services survive slow and failing dependencies: timeouts and deadlines, retries with exponential backoff and jitter, circuit breakers and backpressure.

## 1. Concepts
### Timeouts
Every network call needs one, or a slow dependency ties up all your threads. Propagate a deadline down the call chain so inner calls don't keep working after the caller gave up.

### Retries
Retry transient failures (timeouts, 503) only for idempotent operations, a bounded number of times, and only at one layer of the stack, or retries multiply (3 layers x 3 retries = 27 calls).

### Exponential backoff
Wait longer after each failure (base x 2^attempt, capped) so a struggling server gets room. Add jitter (random spread) so thousands of clients don't retry in lockstep.

### Circuit breakers
After enough failures, stop calling the dependency for a while and fail fast (open). After a cool-down, let one trial call through (half-open); success closes the circuit, failure opens it again.

### Backpressure
When consumers are slower than producers, push back instead of buffering forever: bounded queues that reject or block, load shedding (429/503), and flow control (TCP windows, reactive streams).

## 2. Trade-offs and optimizations
- Timeout too low = false failures; too high = resource exhaustion. Start from the dependency's P99.
- Full jitter (random between 0 and the backoff) spreads load best.
- Retry budgets (e.g. retries <= 10% of requests) stop retry storms.
- Breaker per dependency (and per endpoint), with metrics on state changes.
- Shed low-priority traffic first; a fast 503 beats a slow timeout.

## 3. Demo
A client calls a flaky downstream service. Dial up its failure rate and latency, then switch timeouts, retries (with and without jitter), the circuit breaker and a bounded queue on and off. Charts show success rate, latency, load on the downstream and the breaker's state over time.

- **In the browser:** [40-resilience-patterns on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=40-resilience-patterns). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`downstream.js`](demo/downstream.js), [`circuit_breaker.js`](demo/circuit_breaker.js), [`backoff.js`](demo/backoff.js), [`client.js`](demo/client.js), [`server.js`](demo/server.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=40-resilience-patterns>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `resilience.py`: a circuit breaker with an injectable clock, full-jitter backoff, a retry helper, deadlines with child budgets, and a bounded buffer with reject or drop-oldest policies.
- A FastAPI client calling a toxiproxy-wrapped dependency with all the patterns wired in.

### Milestones
- [ ] Make `pytest 40-resilience-patterns` pass.
- [ ] Put toxiproxy between two services and add 2 s latency; show timeouts protect the caller.
- [ ] Graph retry storms with and without jitter against a recovering server.

### Starter files
- [`resilience.py`](resilience.py)
- [`tests/test_resilience.py`](tests/test_resilience.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 40-resilience-patterns
```

### Stretch goals
- [ ] Adaptive concurrency limits (TCP Vegas / Netflix concurrency-limits).
- [ ] Bulkheads: separate pools per dependency.
- [ ] Hedged requests and compare with retries.

### Suggested stack
Python 3.11, FastAPI, httpx, toxiproxy, pytest

## 5. Break it
- [ ] Remove the timeout and watch the caller's thread pool exhaust.
- [ ] Retry at three layers and count calls hitting the bottom service.
- [ ] Overload a service without load shedding and watch latency climb for everyone.

## 6. Review
- Why add jitter to backoff?
- What are the three states of a circuit breaker?
- Why should only one layer retry?
- What's the difference between backpressure and load shedding?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
