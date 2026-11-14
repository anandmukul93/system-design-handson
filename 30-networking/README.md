# 30 · Networking & Protocols

> Phase 6: Fundamentals deep dives · Suggested time: 3-5 days · [Open the demo](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=30-networking)

**Concepts covered:** #97 DNS · #98 TCP vs UDP · #99 HTTP/2 & HTTP/3 · #100 gRPC

## Goal
Understand what's under every RPC: DNS resolution and caching, TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3, and gRPC's wire format.

## 1. Concepts
### DNS
Names resolve through a chain: stub resolver -> recursive resolver -> root -> TLD -> authoritative server. Answers are cached for their TTL, which is why DNS-based failover is slow and why low TTLs cost more queries. CNAMEs alias one name to another.

### TCP vs UDP
TCP gives an ordered, reliable byte stream with congestion control, at the cost of a handshake and head-of-line blocking. UDP sends independent datagrams with no guarantees: good for DNS, games, video and as a base for QUIC.

### HTTP/2 & HTTP/3
HTTP/2 multiplexes many streams over one TCP connection with header compression, but one lost TCP packet stalls every stream. HTTP/3 runs over QUIC (UDP) so loss only stalls the affected stream, and it has 0/1-RTT setup and connection migration.

### gRPC
RPC over HTTP/2 with Protocol Buffers: compact binary messages (varint-encoded fields), each framed with a 5-byte prefix (compressed flag + 4-byte length). It supports unary and streaming calls, deadlines and generated clients.

## 2. Trade-offs and optimizations
- Throughput of one TCP flow is bounded by window / RTT; long fat pipes need window scaling.
- Connection reuse (keep-alive, HTTP/2) saves handshakes; TLS 1.3 saves an RTT; QUIC saves another.
- DNS TTL is a trade-off between failover speed and resolver load.
- gRPC is great service-to-service; browsers need gRPC-Web or a JSON gateway.
- Protobuf field numbers are forever: never reuse them, only add optional fields.

## 3. Demo
Three panels: a step-by-step DNS resolution with a TTL cache you can expire; a packet-loss simulator comparing HTTP/1.1, HTTP/2 over TCP and HTTP/3 over QUIC when streams share a lossy link; and a protobuf varint encoder that shows the bytes for any number.

- **In the browser:** [30-networking on the showcase site](https://anandmukul93.github.io/system-design-handson/site/chapter.html?ch=30-networking). The demo runs in a sandbox; press **Edit source** to open the demo's files as tabs. The logic is in [`dns_resolver.js`](demo/dns_resolver.js), [`http_versions.js`](demo/http_versions.js), [`varint.js`](demo/varint.js); [`ui.js`](demo/ui.js) only wires the controls to it. Change any file and **Run** it again.
- **Locally:** `make site`, then open <http://localhost:8000/site/chapter.html?ch=30-networking>.

## 4. Build it
Before coding, copy [`../03-design-framework/DESIGN_TEMPLATE.md`](../03-design-framework/DESIGN_TEMPLATE.md) to `DESIGN.md` here and spend 45 minutes designing.

### What you'll build
- `net_protocols.py`: protobuf varints, gRPC length-prefixed frames, a CNAME-following resolver, a TTL DNS cache, and TCP throughput formulas.
- Capture a real `dig +trace` and a Wireshark trace of an HTTP/2 request and annotate them.

### Milestones
- [ ] Make `pytest 30-networking` pass.
- [ ] Run `dig +trace example.com` and map every hop to the resolver chain.
- [ ] Write a tiny UDP echo server and a TCP echo server; measure latency and what happens under `tc netem loss 5%`.

### Starter files
- [`net_protocols.py`](net_protocols.py)
- [`tests/test_net_protocols.py`](tests/test_net_protocols.py)

The stubs raise `NotImplementedError` and the tests define "done". Run them locally, or press **Run Python tests** on the
chapter page to run them in your browser with Pyodide:

```bash
pytest 30-networking
```

### Stretch goals
- [ ] Write a minimal gRPC client by hand: HTTP/2 + framed protobuf.
- [ ] Implement DNS message parsing (RFC 1035) and query 1.1.1.1 over UDP.
- [ ] Measure TLS 1.2 vs 1.3 handshake time.

### Suggested stack
Python 3.11 (stdlib socket), dig, curl with HTTP/3, Wireshark, pytest

## 5. Break it
- [ ] Set a DNS TTL of 3600 on a test record and time how long failover really takes.
- [ ] Add 2% packet loss with `tc netem` and compare curl with `--http1.1`, `--http2` and `--http3` on many small files.
- [ ] Send a gRPC message with a bad length prefix and see what the server does.

## 6. Review
- Why does HTTP/2 still suffer head-of-line blocking?
- What does a DNS TTL trade off?
- How many bytes does the varint for 300 take, and why?
- When would you pick UDP over TCP?
- Compare your `DESIGN.md` with how the earlier product chapters use these ideas.

## Results
_Write your measurements, failure experiments and surprises here._
