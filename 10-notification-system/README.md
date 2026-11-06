# 10 · Design a Notification System

> Notes: [Design a Notification System](https://github.com/liquidslr/system-design-notes/tree/main/10.%20Notification%20System) · Phase 2: Classic product systems · Suggested time: 1 week

## Goal
Build a multi-channel notification service (push, SMS, email) with per-channel queues, retries, dedupe, user settings and delivery tracking, using mock providers that fail on purpose.

## What you'll build
- `POST /notify` API that validates, looks up user contact info and settings, renders a template and enqueues per channel.
- One queue per channel (Redis Streams or Redpanda topics) and worker pools that call mock third-party providers (APNs/FCM/Twilio/SendGrid stand-ins) with configurable failure rate and latency.
- Retries with exponential backoff and a dead-letter queue.
- Dedupe by `event_id` so at-least-once delivery doesn't double-send.
- Notification log table + event tracking (sent, delivered, clicked).

## Key concepts exercised
- Decoupling with message queues
- At-least-once delivery + idempotent dedupe
- Retry with backoff, DLQ
- Notification settings / opt-out
- Per-user rate limiting
- Templates

## Milestones
- [ ] Make `pytest 10-notification-system` pass (dispatcher logic with fake provider).
- [ ] Wire the API + Redis Streams + workers in docker compose. Send 10k notifications with 20% provider failure; verify none lost and none duplicated.
- [ ] Kill a worker mid-batch and show pending messages are reclaimed (XPENDING / XCLAIM).
- [ ] Add per-user rate limiting (chapter 4) and opt-out settings.

## Stretch goals
- [ ] Scheduled notifications (delay queue with a sorted set).
- [ ] Priority lanes (OTP vs marketing).
- [ ] Analytics dashboard of delivery/click rates.

## Suggested stack
Python 3.11, FastAPI, Redis Streams (or Redpanda), Postgres, pytest

## Starter files
- `dispatcher.py`
- `tests/test_dispatcher.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 10-notification-system
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
