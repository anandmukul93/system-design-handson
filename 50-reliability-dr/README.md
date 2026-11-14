# 50 · Reliability & Disaster Recovery

> Phase 8: Production engineering · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=50-reliability-dr)

**Concepts covered:** #83 Disaster Recovery · #84 Backups · #85 Failover · #86 Multi-Region Deployment · #87 Chaos Engineering

## Goal
Plan for the bad day: backups with retention and restore drills, failure detection and failover to the most up-to-date replica, multi-region routing, and chaos experiments that prove it works.

## 1. Concepts
### Disaster recovery
How you get back after losing a zone, region or dataset. Defined by RPO (how much data you can lose) and RTO (how long you can be down). Strategies get faster and costlier: backup & restore, pilot light, warm standby, multi-site active-active.

### Backups
Copies you can restore from: full + incremental, point-in-time recovery from WAL, kept off-site and immutable against ransomware. Retention schemes like grandfather-father-son keep dailies, weeklies and monthlies. A backup you've never restored isn't a backup.

### Failover
Detect the failed primary (missed heartbeats), pick the healthiest, most caught-up replica (highest log position), promote it, fence the old one and repoint clients. Automatic failover is fast but can split-brain without fencing.

### Multi-region deployment
Run in several regions to survive regional outages and serve users closer. Active-passive is simpler; active-active needs conflict handling or partitioned ownership. Route with latency-based DNS or anycast and health checks.

### Chaos engineering
Deliberately inject failures (kill instances, add latency, drop a region) under a stated steady-state hypothesis, with a small blast radius and an abort switch, to find weaknesses before real incidents do.

## 2. Trade-offs and optimizations
- Lower RPO/RTO costs more: synchronous replication, hot standbys, more regions.
- Async cross-region replication means failover can lose recent writes (non-zero RPO).
- Automate failover but require fencing; practise manual failover too.
- Test restores on a schedule and time them; that's your real RTO.
- Start chaos in staging, then production with tight blast radius and observability.

## 3. Demo
A world map with three regions serving traffic. Pull the plug on a primary database or a whole region and watch failure detection, replica promotion by highest LSN, traffic rerouting and how many writes were lost. A chaos panel runs experiments against a steady-state hypothesis, and a backup panel shows which snapshots a retention policy keeps.

- **In the browser:** [50-reliability-dr on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=50-reliability-dr). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=50-reliability-dr>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `reliability.py`: grandfather-father-son backup retention, a heartbeat failure detector, failover target selection by health and LSN, a latency-based multi-region router, and a chaos experiment runner.
- Postgres primary + replica with WAL archiving to MinIO and a timed point-in-time restore drill.

### Milestones
- [ ] Make `pytest 50-reliability-dr` pass.
- [ ] Set up WAL archiving for Postgres to MinIO and restore to a point in time; record the RTO.
- [ ] Use Patroni (or manual promotion) to fail over a primary and measure lost writes with async replication.

### Starter files
- [`reliability.py`](reliability.py)
- [`tests/test_reliability.py`](tests/test_reliability.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 50-reliability-dr
```

### Stretch goals
- [ ] Active-active across two regions with CRDT counters.
- [ ] Backup immutability with S3 object lock.
- [ ] Game day: a scripted regional failover with a timeline and postmortem (chapter 51).

### Suggested stack
Postgres 16 (WAL archiving, PITR), Patroni (optional), MinIO, Toxiproxy or Chaos Mesh, Python 3.11, pytest

## 5. Break it
- [ ] Delete a table on purpose and recover it with PITR.
- [ ] Kill the primary during a write load and count acknowledged writes missing after failover.
- [ ] Run a chaos experiment with Chaos Mesh or Toxiproxy against chapter 8 and check your SLO.

## 6. Review
- Define RPO and RTO and give a strategy for each order of magnitude.
- Why choose the replica with the highest LSN?
- What's split-brain and how does fencing prevent it?
- What makes a chaos experiment safe?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
