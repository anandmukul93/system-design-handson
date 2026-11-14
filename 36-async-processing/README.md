# 36 · Async Processing: Queues, Pub/Sub, Events & Cron

> Phase 7: Distributed patterns · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=36-async-processing)

**Concepts covered:** #15 Message Queues · #16 Pub/Sub · #17 Event-Driven Architecture · #20 Dead Letter Queues · #21 Cron Jobs

## Goal
Move slow work off the request path: a work queue with visibility timeouts and a dead-letter queue, a pub/sub event bus, and a cron scheduler you write yourself.

## 1. Concepts
### Message queues
Producers enqueue jobs, workers pull them. Each message goes to one consumer. With at-least-once delivery a message reappears if the worker doesn't delete it before the visibility timeout, so handlers must be idempotent.

### Pub/Sub
Publishers send events to a topic and every subscriber gets a copy. It decouples who produces from who reacts, and lets you add consumers without touching producers.

### Event-driven architecture
Services announce facts (`OrderPlaced`) instead of calling each other. You gain loose coupling and an audit trail; you pay with eventual consistency, harder debugging and schema evolution of events.

### Dead letter queues
After N failed receives a poison message moves to a DLQ so it stops blocking the queue. Alert on DLQ depth, inspect, fix and redrive.

### Cron jobs
Time-triggered work with a 5-field expression (minute hour day-of-month month day-of-week). In a cluster, make sure only one instance runs each job (leader election or a lock) and that missed runs are handled.

## 2. Trade-offs and optimizations
- Visibility timeout too short: duplicates; too long: slow recovery from crashed workers.
- Queue (one consumer) vs topic (every subscriber): choose by whether each event needs one or many reactions.
- Put the event schema in a registry and only add optional fields.
- Cron in a cluster needs a lock; cron in Kubernetes is a CronJob with `concurrencyPolicy: Forbid`.
- Backpressure: cap queue depth or slow producers rather than letting the queue grow forever.

## 3. Demo
An animated work queue: producers add jobs, workers take them, some crash mid-job and their messages reappear after the visibility timeout, poison messages land in the DLQ. A second panel evaluates any cron expression and lists its next ten run times.

- **In the browser:** [36-async-processing on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=36-async-processing). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`work_queue.js`](demo/work_queue.js), [`worker_pool.js`](demo/worker_pool.js), [`cron.js`](demo/cron.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=36-async-processing>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `async_jobs.py`: a 5-field cron parser with `next_run`, an SQS-style queue with visibility timeouts, receive counts and a DLQ, and an in-process pub/sub bus.
- A real version on Redis Streams or Redpanda with a worker pool and a cron runner that takes a Redis lock.

### Milestones
- [ ] Make `pytest 36-async-processing` pass.
- [ ] Run producers and workers on Redis Streams; kill a worker and watch its messages get reclaimed.
- [ ] Run the cron scheduler on 3 replicas with a Redis lock and confirm each job runs once.

### Starter files
- [`async_jobs.py`](async_jobs.py)
- [`tests/test_async_jobs.py`](tests/test_async_jobs.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 36-async-processing
```

### Stretch goals
- [ ] Delayed messages with a sorted set.
- [ ] Transactional outbox feeding the bus (chapter 37).
- [ ] Event schema registry with compatibility checks.

### Suggested stack
Python 3.11, Redis Streams or Redpanda, pytest

## 5. Break it
- [ ] Make one message always throw and watch it land in the DLQ; redrive it after a fix.
- [ ] Set the visibility timeout shorter than the job time and count duplicates.
- [ ] Stop the cron leader during a run and see what the others do.

## 6. Review
- Queue or topic for 'send a welcome email'? For 'user signed up'?
- What happens if a worker crashes after doing the work but before deleting the message?
- How do you stop a cron job running twice in a cluster?
- When does a message go to the DLQ?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
