# 12 · Design a Chat System

> Notes: [Design a Chat System](https://github.com/liquidslr/system-design-notes/tree/main/12.%20Chat%20System) · Phase 2: Classic product systems · Suggested time: 1-2 weeks

## Goal
Build a WebSocket chat with 1:1 and small group chats, per-channel message ordering, multi-device sync and online presence via heartbeats.

## What you'll build
- Stateless API service (login, contacts, channel creation) + stateful WebSocket chat servers.
- Message IDs that are monotonic per channel (local sequence) and a key-value style message store (Postgres partitioned by channel, or Cassandra/ScyllaDB as a stretch).
- Message routing between chat servers through Redis pub/sub (one channel per user inbox).
- Multi-device sync: each device keeps `cur_max_message_id` and pulls missed messages on reconnect.
- Presence service driven by heartbeats with a timeout, fanned out to friends.

## Key concepts exercised
- Polling vs long polling vs WebSockets
- Stateful service and service discovery
- Message ordering and IDs
- Multi-device sync
- Presence with heartbeats
- Group chat fan-out

## Milestones
- [ ] Make `pytest 12-chat-system` pass (message store + presence logic).
- [ ] Build a WebSocket server; chat between two browser tabs.
- [ ] Run 2 chat servers behind a simple discovery endpoint; route messages via Redis pub/sub.
- [ ] Disconnect a client, send messages, reconnect and verify sync from `cur_max_message_id`.

## Stretch goals
- [ ] Read receipts and typing indicators.
- [ ] End-to-end encryption (X25519 + AES-GCM) for 1:1 chats.
- [ ] Use ZooKeeper/etcd for service discovery instead of a static list.

## Suggested stack
Python 3.11, FastAPI WebSockets (or websockets lib), Redis pub/sub, Postgres, pytest

## Starter files
- `chat_core.py`
- `tests/test_chat_core.py`

The starter modules contain stubs that raise `NotImplementedError`. The tests describe the behaviour you need, so
they fail until you implement the stubs. Work test-first:

```bash
pytest 12-chat-system
```

## Before you code
Copy `../03-design-framework/DESIGN_TEMPLATE.md` to `DESIGN.md` in this folder and spend 45 minutes on the design
first. After you finish building, come back and note what you'd change.

## Results
_Write your measurements here (throughput, latency, memory, failure experiments) and what surprised you._
