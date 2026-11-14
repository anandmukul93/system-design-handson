// WebSocket vs SSE vs long polling on the same event stream. Edit me and press Run.
K.title("Real-time transports", "One server event stream, three clients. Compare requests, bytes and delay, then drop the connection.");

K.section("Stream");
const rate = K.slider("Events per second", 0.2, 20, 2, 0.2);
const rtt = K.slider("RTT (ms)", 10, 400, 80, 10);
K.button("Drop all connections", drop, "danger");
const T = ["WebSocket", "SSE", "Long polling"];
const st = K.table(["Transport", "Requests", "Bytes on wire", "Avg delay (ms)", "Missed", "State"]);
const chart = K.chart(T.map((t) => ({ name: t + " delay" })), { height: 160 });
const log = K.log(90);
const HDR = 450, FRAME = { WebSocket: 6, SSE: 10, "Long polling": HDR };   // overhead per message
const c = Object.fromEntries(T.map((t) => [t, { req: 1, bytes: HDR, delays: [], missed: 0, down: 0, lastId: 0, got: new Set() }]));
let now = 0, nextId = 1, acc = 0;
const backlog = [];                     // server-side buffer by id (lets SSE resume with Last-Event-ID)
function drop() {
  for (const t of T) c[t].down = t === "WebSocket" ? 3000 : t === "SSE" ? 3000 : rtt.value;   // SSE has built-in retry: 3 s
  log.add("network blip: all connections dropped", "bad");
}
K.loop(() => {
  now += 100; acc += rate.value / 10;
  while (acc >= 1) { acc--; backlog.push({ id: nextId++, at: now }); }
  for (const t of T) {
    const s = c[t];
    if (s.down > 0) {
      s.down -= 100;
      if (s.down <= 0) {
        s.req++; s.bytes += HDR;
        const missed = backlog.filter((e) => e.id > s.lastId);
        if (t === "WebSocket") { const lost = missed.length; s.missed += lost; s.lastId = nextId - 1; log.add(`WebSocket reconnected by app code: ${lost} events lost unless the app re-syncs`, lost ? "warn" : "ok"); }
        else { log.add(`${t} reconnected and resumed from id ${s.lastId}${t === "SSE" ? " (Last-Event-ID)" : ""}`, "ok"); }
      }
      continue;
    }
    for (const e of backlog) {
      if (e.id <= s.lastId) continue;
      const delay = (t === "Long polling" ? rtt.value : rtt.value / 2) + (now - e.at);
      s.delays.push(delay); s.bytes += FRAME[t] + 40; s.lastId = e.id;
      if (t === "Long polling") { s.req++; break; }               // each poll returns, client must re-request
    }
  }
  while (backlog.length > 500) backlog.shift();
  const avg = (a) => (a.length ? a.slice(-50).reduce((x, y) => x + y, 0) / Math.min(50, a.length) : 0);
  chart.push(...T.map((t) => avg(c[t].delays)));
  st.set(T.map((t) => [t, c[t].req, K.fmt(c[t].bytes), avg(c[t].delays).toFixed(0), c[t].missed, c[t].down > 0 ? "reconnecting" : "open"]));
}, 100);
log.add("Long polling pays headers and an RTT per event; SSE resumes by id; a raw WebSocket needs your own resume logic.", "muted");
