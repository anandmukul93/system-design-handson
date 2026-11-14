# 10 · Design a Notification System

> Phase 2: Classic product systems · Suggested time: 1 week · Notes: [Design a Notification System](https://github.com/liquidslr/system-design-notes/tree/main/10.%20Notification%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=10-notification-system)

**Concepts covered:** #12 Retries · #13 Exponential Backoff · #20 Dead Letter Queues

## Goal
Build a multi-channel notification service (push, SMS, email) with per-channel queues, retries, dedupe, user settings and delivery tracking, using mock providers that fail on purpose.

## 1. Concepts
### Channels and providers
Push (APNs/FCM), SMS (Twilio) and email (SendGrid) are third-party services that can be slow or fail.

### Queues per channel
Decouple the API from delivery with one queue per channel so a slow SMS provider doesn't block push notifications.

### Reliability
At-least-once delivery plus dedupe by event id; retries with exponential backoff; a dead-letter queue for messages that keep failing.

### User settings and rate limits
Respect opt-outs per channel and cap notifications per user so you don't spam.

## 2. Trade-offs and optimizations
- Retries improve delivery but risk duplicates; dedupe on the worker side.
- Per-channel queues isolate failures but add operational pieces.
- Templates centralise content but need versioning and localisation.

## 3. Demo
Send notification bursts through per-channel queues to mock providers. Dial each provider's failure rate and latency and watch retries with backoff, dedupe of repeated events and messages landing in the dead-letter queue.

- **In the browser:** [10-notification-system on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=10-notification-system). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=10-notification-system>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `POST /notify` API that validates, looks up user contact info and settings, renders a template and enqueues per channel.
- One queue per channel (Redis Streams or Redpanda topics) and worker pools that call mock third-party providers (APNs/FCM/Twilio/SendGrid stand-ins) with configurable failure rate and latency.
- Retries with exponential backoff and a dead-letter queue.
- Dedupe by `event_id` so at-least-once delivery doesn't double-send.
- Notification log table + event tracking (sent, delivered, clicked).

### Milestones
- [ ] Make `pytest 10-notification-system` pass (dispatcher logic with fake provider).
- [ ] Wire the API + Redis Streams + workers in docker compose. Send 10k notifications with 20% provider failure; verify none lost and none duplicated.
- [ ] Kill a worker mid-batch and show pending messages are reclaimed (XPENDING / XCLAIM).
- [ ] Add per-user rate limiting (chapter 4) and opt-out settings.

### Starter files
- [`dispatcher.py`](dispatcher.py)
- [`tests/test_dispatcher.py`](tests/test_dispatcher.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 10-notification-system
```

### Stretch goals
- [ ] Scheduled notifications (delay queue with a sorted set).
- [ ] Priority lanes (OTP vs marketing).
- [ ] Analytics dashboard of delivery/click rates.

### Suggested stack
Python 3.11, FastAPI, Redis Streams (or Redpanda), Postgres, pytest

## 5. Break it
- [ ] Set the SMS provider to 100% failure and watch push stay healthy.
- [ ] Send the same event id twice and confirm one delivery.
- [ ] Kill a worker mid-batch and reclaim pending messages.

## 6. Review
- Why one queue per channel?
- How do you avoid sending a notification twice?
- What goes in the dead-letter queue and who looks at it?
- Where do opt-out checks happen?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/10.%20Notification%20System).

## Results
_Write your measurements, failure experiments and surprises here._
