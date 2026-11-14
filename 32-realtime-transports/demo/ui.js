// UI only: one event stream, three clients, a table and a delay chart.
import { EventStream } from "./event_stream.js";
import { TransportClient } from "./client.js";
import { webSocket } from "./websocket.js";
import { serverSentEvents } from "./sse.js";
import { longPolling } from "./long_polling.js";

K.title(
  "Real-time transports",
  "One server event stream, three clients. Compare requests, bytes and delay, then drop the connection.",
);

K.section("Stream");
const rate = K.slider("Events per second", 0.2, 20, 2, 0.2);
const rtt = K.slider("RTT (ms)", 10, 400, 80, 10);
K.button("Drop all connections", dropAll, "danger");

const STEP_MS = 100;
const stream = new EventStream();
const clients = [webSocket, serverSentEvents, longPolling].map((t) => new TransportClient(t));
const table = K.table(["Transport", "Requests", "Bytes on wire", "Avg delay (ms)", "Missed", "State"]);
const chart = K.chart(
  clients.map((c) => ({ name: c.transport.name + " delay" })),
  { height: 160 },
);
const log = K.log(90);
let now = 0;
let owed = 0; // fractional events carried between ticks

function dropAll() {
  for (const c of clients) c.disconnect(rtt.value);
  log.add("network blip: all connections dropped", "bad");
}
K.loop(() => {
  now += STEP_MS;
  owed += (rate.value * STEP_MS) / 1000;
  for (; owed >= 1; owed--) stream.publish(now);
  for (const c of clients) for (const m of c.tick(stream, now, rtt.value, STEP_MS)) log.add(m.text, m.kind);
  chart.push(...clients.map((c) => c.averageDelay()));
  table.set(
    clients.map((c) => [
      c.transport.name,
      c.requests,
      K.fmt(c.bytes),
      c.averageDelay().toFixed(0),
      c.missed,
      c.state,
    ]),
  );
}, STEP_MS);
log.add(
  "Long polling pays headers and an RTT per event; SSE resumes by id; a raw WebSocket needs your own resume logic.",
  "muted",
);
