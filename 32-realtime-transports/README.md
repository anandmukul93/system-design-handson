# 32 · Real-time Transports

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=32-realtime-transports)

**Concepts covered:** #22 WebSockets · #23 Long Polling · #24 Server-Sent Events

## Goal
Compare the three ways a server pushes data to a browser by implementing their wire formats: WebSocket frames, Server-Sent Events and long polling.

## 1. Concepts
### WebSockets
An HTTP Upgrade turns one TCP connection into a full-duplex message channel. The handshake proves the server speaks WebSocket (SHA-1 of the key + a GUID); frames carry an opcode, length and, from clients, a 4-byte XOR mask.

### Long polling
The client asks for news and the server holds the request open until something happens or a timeout fires, then the client immediately asks again. Works everywhere, costs a request per message batch.

### Server-Sent Events
A plain HTTP response with `text/event-stream` that never ends: the server writes `data:` lines separated by blank lines. One-way (server to client), auto-reconnects and resumes with `Last-Event-ID`, and works through most proxies.

## 2. Trade-offs and optimizations
- WebSockets: lowest overhead and bidirectional, but stateful connections complicate load balancing and deploys.
- SSE: simplest for one-way feeds (notifications, dashboards, LLM token streams); limited to ~6 connections per host on HTTP/1.1, fine on HTTP/2.
- Long polling: the compatibility fallback; watch for thundering herds after timeouts.
- All three need heartbeats to detect dead connections and a cursor so clients resume without gaps.

## 3. Demo
Three clients side by side receiving the same event stream from a simulated server: WebSocket, SSE and long polling. Watch requests, bytes on the wire and delivery delay for each, and drop the connection to see how each one recovers.

- **In the browser:** [32-realtime-transports on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=32-realtime-transports). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`event_stream.js`](demo/event_stream.js), [`client.js`](demo/client.js), [`websocket.js`](demo/websocket.js), [`sse.js`](demo/sse.js), [`long_polling.js`](demo/long_polling.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=32-realtime-transports>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `realtime.py`: the WebSocket accept key and frame encoder/decoder (with masking), SSE formatting and an incremental SSE parser, and a long-poll broker with cursors.
- A FastAPI app exposing the same feed three ways: `/ws`, `/sse` and `/poll?cursor=`.

### Milestones
- [ ] Make `pytest 32-realtime-transports` pass.
- [ ] Serve the feed three ways from FastAPI and connect from the browser devtools.
- [ ] Measure requests/sec and bytes/sec per transport at 1 event/sec and 100 events/sec.

### Starter files
- [`realtime.py`](realtime.py)
- [`tests/test_realtime.py`](tests/test_realtime.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 32-realtime-transports
```

### Stretch goals
- [ ] WebSocket compression (permessage-deflate).
- [ ] Fan out one feed to 50k SSE clients using Redis pub/sub (chapter 17).
- [ ] Graceful WebSocket drain during deploys.

### Suggested stack
Python 3.11, FastAPI (WebSockets + StreamingResponse), nginx, pytest

## 5. Break it
- [ ] Kill the server and watch SSE reconnect with `Last-Event-ID`.
- [ ] Put nginx in front with default buffering and see SSE stall; fix it with `proxy_buffering off`.
- [ ] Open 10k idle WebSockets and measure server memory.

## 6. Review
- Why must browser WebSocket frames be masked?
- When is SSE a better choice than WebSockets?
- How does a long-poll client avoid missing events between requests?
- What does `Last-Event-ID` do?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
