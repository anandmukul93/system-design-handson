# 12 · Design a Chat System

> Phase 2: Classic product systems · Suggested time: 1-2 weeks · Notes: [Design a Chat System](https://github.com/liquidslr/system-design-notes/tree/main/12.%20Chat%20System) · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=12-chat-system)

**Concepts covered:** #9 Service Discovery · #22 WebSockets · #23 Long Polling

## Goal
Build a WebSocket chat with 1:1 and small group chats, per-channel message ordering, multi-device sync and online presence via heartbeats.

## 1. Concepts
### Transport choice
Polling wastes requests, long polling holds them open, WebSockets give a persistent two-way channel, which suits chat.

### Stateful chat servers
Each user is connected to one chat server; service discovery picks the server and a message router (pub/sub) delivers across servers.

### Message ids and sync
Per-channel increasing ids order messages; each device remembers its latest id and fetches newer ones on reconnect.

### Presence
Clients send heartbeats; a user is offline after missing them for a timeout, and status changes fan out to friends.

## 2. Trade-offs and optimizations
- Stateful connections complicate deploys and load balancing.
- Heartbeat interval trades presence accuracy for traffic.
- Large groups need fan-out limits or a pull model.

## 3. Demo
Two chat servers with users connected to each: send 1:1 and group messages and watch them route through pub/sub, disconnect a device and see it sync from its last message id on reconnect, and stop heartbeats to flip presence.

- **In the browser:** [12-chat-system on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=12-chat-system). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`chat_cluster.js`](demo/chat_cluster.js), [`presence.js`](demo/presence.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=12-chat-system>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- Stateless API service (login, contacts, channel creation) + stateful WebSocket chat servers.
- Message IDs that are monotonic per channel (local sequence) and a key-value style message store (Postgres partitioned by channel, or Cassandra/ScyllaDB as a stretch).
- Message routing between chat servers through Redis pub/sub (one channel per user inbox).
- Multi-device sync: each device keeps `cur_max_message_id` and pulls missed messages on reconnect.
- Presence service driven by heartbeats with a timeout, fanned out to friends.

### Milestones
- [ ] Make `pytest 12-chat-system` pass (message store + presence logic).
- [ ] Build a WebSocket server; chat between two browser tabs.
- [ ] Run 2 chat servers behind a simple discovery endpoint; route messages via Redis pub/sub.
- [ ] Disconnect a client, send messages, reconnect and verify sync from `cur_max_message_id`.

### Starter files
- [`chat_core.py`](chat_core.py)
- [`tests/test_chat_core.py`](tests/test_chat_core.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 12-chat-system
```

### Stretch goals
- [ ] Read receipts and typing indicators.
- [ ] End-to-end encryption (X25519 + AES-GCM) for 1:1 chats.
- [ ] Use ZooKeeper/etcd for service discovery instead of a static list.

### Suggested stack
Python 3.11, FastAPI WebSockets (or websockets lib), Redis pub/sub, Postgres, pytest

## 5. Break it
- [ ] Kill a chat server and watch clients reconnect elsewhere.
- [ ] Deliver messages out of order and see ids fix the display.
- [ ] Set the heartbeat timeout too short and watch presence flap.

## 6. Review
- Why WebSockets for chat?
- How do two users on different servers talk?
- How does a reconnecting device know what it missed?
- How does presence work?
- Compare your `DESIGN.md` and results with the [chapter notes](https://github.com/liquidslr/system-design-notes/tree/main/12.%20Chat%20System).

## Results
_Write your measurements, failure experiments and surprises here._
