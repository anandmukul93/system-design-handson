# 45 · Deployments & Releases

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=45-deployments-releases)

**Concepts covered:** #51 Feature Flags · #52 Blue-Green Deployment · #53 Canary Releases · #54 Rolling Deployments · #55 Rollbacks

## Goal
Ship changes safely: feature flags with stable percentage rollouts, rolling deployments with surge and unavailability budgets, blue-green switches, canary analysis and fast rollbacks.

## 1. Concepts
### Feature flags
Decouple deploy from release: ship code dark and turn it on per user, segment or percentage. Hash user id + flag name into a bucket so a user's experience is stable and raising the percentage only adds users. Clean up old flags.

### Blue-green deployment
Run two identical environments; deploy to the idle one, test it, then switch the router. Rollback is switching back. Costs double capacity and needs care with database changes.

### Canary releases
Send a small slice of traffic to the new version, compare its error rate and latency with the baseline, and promote or roll back automatically. Catches problems that only appear with real traffic.

### Rolling deployments
Replace instances a few at a time. maxSurge says how many extra can exist, maxUnavailable how many can be missing. Cheap, but old and new versions serve side by side, so changes must be compatible.

### Rollbacks
The fastest fix for a bad deploy. Keep the previous artifact, make deploys reversible (expand/contract schema changes, chapter 49), and practise it. Flags give an even faster 'kill switch'.

## 2. Trade-offs and optimizations
- Flags add code paths and test combinations; expire them.
- Canary needs enough traffic to be statistically meaningful; wait for min requests.
- Blue-green doubles cost during the switch; rolling is cheap but slower to roll back.
- Every strategy requires backward-compatible APIs and schemas between N and N-1.
- Automate rollback on SLO burn (chapter 46).

## 3. Demo
Pick a strategy (rolling, blue-green, canary) and deploy a buggy or healthy version to a fleet of 10 instances. Watch instance versions change, traffic split, error rate move and the automatic rollback fire. A flag panel shows which users see a feature as you drag the rollout percentage.

- **In the browser:** [45-deployments-releases on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=45-deployments-releases). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=45-deployments-releases>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `releases.py`: stable flag bucketing and evaluation, a rolling deployment planner, a canary decision function and a blue-green router with rollback.
- Argo Rollouts (or plain Kubernetes) running a canary of the chapter 8 service on kind.

### Milestones
- [ ] Make `pytest 45-deployments-releases` pass.
- [ ] Do a rolling update on kind with `maxSurge: 1, maxUnavailable: 0` while running a load test; confirm zero errors.
- [ ] Add a feature flag to an endpoint and roll it out 1% -> 10% -> 100%.

### Starter files
- [`releases.py`](releases.py)
- [`tests/test_releases.py`](tests/test_releases.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 45-deployments-releases
```

### Stretch goals
- [ ] Argo Rollouts with automated analysis on Prometheus metrics.
- [ ] Experiment framework: A/B test with significance testing.
- [ ] Shadow traffic (mirroring) before a canary.

### Suggested stack
Kubernetes (kind), Argo Rollouts (optional), Python 3.11, pytest

## 5. Break it
- [ ] Deploy a version that fails readiness and watch the rollout stall.
- [ ] Make the new version use a renamed DB column and break the old pods mid-rollout.
- [ ] Run a canary on 1% of 50 requests and see why the result is meaningless.

## 6. Review
- Why hash user + flag name for rollouts?
- What do maxSurge and maxUnavailable control?
- When is blue-green better than rolling?
- What must be true about schemas during any rolling deploy?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
