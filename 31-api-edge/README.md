# 31 · APIs & the Edge

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=31-api-edge)

**Concepts covered:** #3 Load Balancing · #4 Reverse Proxies · #5 API Gateways · #101 Webhooks · #102 API Versioning

## Goal
Build the layer between clients and services: a reverse proxy with weighted load balancing, an API gateway that routes by version, and signed webhooks.

## 1. Concepts
### Reverse proxies
A server that accepts client connections and forwards them to backends: it terminates TLS, balances load, caches, compresses and hides the topology (nginx, Envoy, HAProxy).

### Load balancing
Spread requests across healthy backends. Round robin and smooth weighted round robin are simple; least-connections and power-of-two-choices adapt to slow servers; consistent hashing keeps affinity.

### API gateways
A reverse proxy with API smarts: routing by path and version, authentication, rate limiting, request/response transformation and aggregation, one place for cross-cutting concerns.

### API versioning
Clients upgrade slowly, so breaking changes need a new version: in the path (/v2), a header, or a media type. Additive changes don't need one. Deprecate with dates and Sunset headers.

### Webhooks
Server-to-server callbacks: you POST events to a URL the customer registered. Sign each payload (HMAC over timestamp + body), include an event id for idempotency, retry with backoff and let receivers reject old timestamps to stop replays.

## 2. Trade-offs and optimizations
- Gateways centralise policy but are a shared failure point; keep them stateless and horizontally scaled.
- Smooth weighted round robin avoids sending bursts to the heaviest server.
- Path versioning is visible and cacheable; header versioning keeps URLs clean.
- Webhook receivers should ack fast (200 then queue) so the sender's retry timer doesn't fire.
- Use constant-time comparison when checking signatures.

## 3. Demo
A live gateway playground: send requests with different paths and API-Version headers and watch them route to v1/v2 backends; change backend weights and see the smooth weighted round-robin sequence; and sign a webhook, tamper with it or replay it late to see verification fail.

- **In the browser:** [31-api-edge on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=31-api-edge). The demo runs in a sandbox; press **Edit source** to change [`demo/demo.js`](demo/demo.js) and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=31-api-edge>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `api_edge.py`: smooth weighted round robin (nginx's algorithm), a versioned longest-prefix gateway router, and webhook HMAC signing/verification with replay protection.
- An nginx config that fronts two FastAPI apps (v1, v2) with weights, and a FastAPI webhook receiver.

### Milestones
- [ ] Make `pytest 31-api-edge` pass.
- [ ] Put nginx in front of two app versions and route `/v2/*` to the new one.
- [ ] Build a webhook sender with retries and a receiver that verifies signatures.

### Starter files
- [`api_edge.py`](api_edge.py)
- [`tests/test_api_edge.py`](tests/test_api_edge.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 31-api-edge
```

### Stretch goals
- [ ] Least-connections and power-of-two-choices balancers, compared under a slow backend.
- [ ] Gateway auth: validate JWTs (chapter 47) at the edge.
- [ ] Use Envoy instead of nginx and add retries and outlier detection.

### Suggested stack
Python 3.11, FastAPI, nginx (or Envoy), pytest

## 5. Break it
- [ ] Kill one backend behind nginx and watch passive health checks (`max_fails`) take it out.
- [ ] Replay a captured webhook 10 minutes later and make sure it's rejected.
- [ ] Send a v1 client to v2 by accident and decide how the gateway should respond.

## 6. Review
- What does a gateway add on top of a reverse proxy?
- Why sign a timestamp together with the webhook body?
- When is a change breaking enough for a new API version?
- Why does smooth weighted RR beat naive weighted RR?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
