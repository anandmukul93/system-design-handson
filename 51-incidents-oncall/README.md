# 51 · Production Incidents, On-Call & Postmortems

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=51-incidents-oncall)

**Concepts covered:** #109 Production Incidents · #110 On-Call · #111 Postmortems

## Goal
Practise the human side of operating systems: classify and run incidents, measure detection and recovery times, build a fair on-call rotation and write blameless postmortems.

## 1. Concepts
### Production incidents
An unplanned event that hurts users or risks doing so. Declare early, assign roles (incident commander, communications, operations), mitigate first (rollback, failover, feature flag off), and investigate root cause later. Severity levels set the response.

### On-call
Engineers take turns being reachable to respond. Make it sustainable: primary + secondary, follow-the-sun where possible, handoffs, compensation, actionable alerts only and runbooks for each one. Track pages per shift.

### Postmortems
A written review after an incident: summary, impact, timeline, root causes and contributing factors, what went well, and action items with owners. Blameless: focus on how the system allowed the failure, not who typed the command.

## 2. Trade-offs and optimizations
- Mitigate before you diagnose: a rollback in 5 minutes beats a fix in an hour.
- MTTD and MTTR are the levers: better alerts shrink detection, runbooks and automation shrink recovery.
- Too many pages = alert fatigue = missed real incidents.
- Action items without owners and dates don't happen.
- Blameless culture gets you honest timelines, which get you real fixes.

## 3. Demo
An incident simulator: an alert fires, you choose actions (check dashboards, roll back, fail over, page help) against a clock while users are affected, and at the end it builds the timeline, computes MTTD/MTTA/MTTR and drafts a postmortem you can edit. A rotation panel generates a fair on-call schedule with overrides.

- **In the browser:** [51-incidents-oncall on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=51-incidents-oncall). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=51-incidents-oncall>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `incidents.py`: severity classification, incident timing metrics, an on-call rotation generator with overrides, a postmortem skeleton generator and a blame-language checker.
- A runbook for one alert from chapter 46 and a postmortem for a real failure you caused in chapter 50.

### Milestones
- [ ] Make `pytest 51-incidents-oncall` pass.
- [ ] Run a game day with a friend: they break something from chapter 50, you respond using a runbook.
- [ ] Write a postmortem using the generated skeleton and review it for blame language.

### Starter files
- [`incidents.py`](incidents.py)
- [`tests/test_incidents.py`](tests/test_incidents.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 51-incidents-oncall
```

### Stretch goals
- [ ] Status page automation from incident state.
- [ ] Incident bot in Slack that creates channels and records the timeline.
- [ ] Measure on-call load across a quarter and rebalance.

### Suggested stack
Python 3.11, PagerDuty/Opsgenie free tier (optional), pytest

## 5. Break it
- [ ] Run an incident with no incident commander and note what goes wrong.
- [ ] Page yourself every 10 minutes for an hour with non-actionable alerts.
- [ ] Try writing a postmortem whose root cause is 'human error' and keep asking why.

## 6. Review
- What should the first 5 minutes of an incident look like?
- What do MTTD and MTTR measure?
- What makes an on-call rotation sustainable?
- Why are postmortems blameless?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
