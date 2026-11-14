# 41 · Scaling, Serverless & Cost

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=41-scaling-serverless-cost)

**Concepts covered:** #45 Autoscaling · #46 Horizontal Scaling · #47 Vertical Scaling · #88 Cost Optimization · #89 Cold Starts · #90 Serverless Limits

## Goal
Decide how and when to scale and what it costs: target-tracking autoscaling, horizontal vs vertical, serverless cold starts and limits, and break-even maths between serverless and servers.

## 1. Concepts
### Autoscaling
Adjust capacity to load automatically. Target tracking keeps a metric near a target: desired = ceil(current x metric / target). Scale out fast, scale in slowly (cooldown) to avoid flapping; scale on a leading metric (queue depth, RPS) rather than a lagging one.

### Horizontal scaling
Add more machines behind a load balancer. Needs stateless services and partitioned data; gives near-unlimited capacity and fault tolerance.

### Vertical scaling
Use a bigger machine. Simple and no code changes, but has a ceiling, a single point of failure and usually a restart.

### Cold starts
A serverless platform must start a new sandbox (download code, start runtime, run init) when no warm instance is free. That adds 100 ms to several seconds. Mitigate with smaller packages, lazy init, provisioned concurrency or keep-warm pings.

### Serverless limits
Functions have max duration, memory, payload size, concurrency and connection limits. Long jobs, websockets, big files and DB connection storms need other designs (queues, step functions, RDS proxy).

### Cost optimization
Right-size instances, use spot/preemptible for stateless work, commit to reserved capacity for the baseline, scale to zero when idle, cut egress and storage tiers. Know the break-even point between per-request and per-hour pricing.

## 2. Trade-offs and optimizations
- Serverless is cheapest for spiky, low-average traffic; reserved VMs for steady high traffic.
- Scale-in cooldowns prevent oscillation but waste money after a spike.
- Predictive/scheduled scaling for known daily peaks beats reactive scaling.
- Every autoscaler needs max limits so a bug or attack can't bankrupt you.
- Cold starts hurt P99, not average latency.

## 3. Demo
A day of traffic (with a spike) hits your service. Choose fixed servers, target-tracking autoscaling or serverless, tune target utilisation, cooldown and idle timeout, and watch capacity, latency, cold starts and the running cost bill side by side.

- **In the browser:** [41-scaling-serverless-cost on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=41-scaling-serverless-cost). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=41-scaling-serverless-cost>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `autoscale.py`: a target-tracking scaler with cooldown and bounds, a function pool that counts cold starts, and a serverless vs VM monthly cost comparison.
- A Kubernetes HPA (kind or k3d) scaling a CPU-bound app under load, and the same function on AWS Lambda (free tier) to measure real cold starts.

### Milestones
- [ ] Make `pytest 41-scaling-serverless-cost` pass.
- [ ] Run an HPA on kind with a load generator and graph replicas vs CPU.
- [ ] Deploy a function to Lambda (or OpenFaaS locally) and measure cold vs warm latency by package size.

### Starter files
- [`autoscale.py`](autoscale.py)
- [`tests/test_autoscale.py`](tests/test_autoscale.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 41-scaling-serverless-cost
```

### Stretch goals
- [ ] Predictive scaling from last week's traffic.
- [ ] KEDA scaling on queue depth.
- [ ] Spot instance interruption handling.

### Suggested stack
Python 3.11, kind/k3d + HPA, AWS Lambda or OpenFaaS, pytest

## 5. Break it
- [ ] Set the scale-in cooldown to 0 and watch the replica count flap.
- [ ] Remove max replicas and run a load test (in a sandbox!).
- [ ] Open a DB connection per Lambda invocation at 500 concurrency.

## 6. Review
- Why scale out fast and scale in slowly?
- When is serverless more expensive than a VM?
- What makes a cold start slow and how do you shorten it?
- What can't you run well on functions?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
