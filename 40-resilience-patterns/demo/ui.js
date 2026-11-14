// UI only: toggles for each protection, and charts of success rate, downstream load and client latency.
import { Downstream } from "./downstream.js";
import { CircuitBreaker } from "./circuit_breaker.js";
import { exponentialBackoff, jitteredBackoff } from "./backoff.js";
import { request } from "./client.js";
import { RequestQueue, requestsServedPerTick } from "./server.js";

K.title(
  "Resilience patterns",
  "A client calls a flaky downstream. Turn the protections on and off and watch success, latency and load.",
);

const random = K.rng(40);
const downstream = new Downstream(random);
const queue = new RequestQueue();
const BREAKER_MESSAGES = {
  open: ["breaker OPEN: failing fast for 3 s", "bad"],
  "half-open": ["breaker half-open: one probe", "warn"],
  closed: ["probe ok: breaker closed", "ok"],
};
const breaker = new CircuitBreaker({ onChange: (state) => log.add(...BREAKER_MESSAGES[state]) });

K.section("Downstream");
const failPercent = K.slider("Failure %", 0, 100, 10, 1);
const latency = K.slider("Latency (ms)", 10, 2000, 80, 10);
K.button(
  "Outage for 10 s",
  () => {
    downstream.outageTicks = 40;
    log.add("downstream outage starts", "bad");
  },
  "danger",
);
K.section("Client protections");
const TIMEOUT_MS = 300;
const useTimeout = K.toggle("Timeout at 300 ms", true);
const useRetries = K.toggle("Retry up to 3x", true);
const useJitter = K.toggle("Exponential backoff with jitter", true);
const useBreaker = K.toggle("Circuit breaker (50% errors over 20 calls)", true);
const useBoundedQueue = K.toggle("Bounded queue / load shedding", true);
const st = K.stats({
  ok: "Success %",
  p99: "Client p99 (ms)",
  load: "Downstream calls / tick",
  breaker: "Breaker",
  queue: "Queue depth",
});
const chart = K.chart([{ name: "success %" }, { name: "downstream load" }], { height: 150 });
const latencyChart = K.chart([{ name: "client latency p99" }], { height: 110 });
const log = K.log(70);

const ARRIVALS_PER_TICK = 20;
const QUEUE_LIMIT = 60;
let tick = 0;
K.loop(() => {
  tick++;
  downstream.outageTicks = Math.max(0, downstream.outageTicks - 1);
  downstream.failurePercent = failPercent.value;
  downstream.latencyMs = latency.value;
  const protections = {
    timeoutMs: useTimeout.value ? TIMEOUT_MS : null,
    maxAttempts: useRetries.value ? 4 : 1,
    backoff: useJitter.value ? jitteredBackoff : exponentialBackoff,
    breaker: useBreaker.value ? breaker : null,
  };

  const shed = queue.arrive(ARRIVALS_PER_TICK, useBoundedQueue.value ? QUEUE_LIMIT : Infinity);
  const holdMs = useTimeout.value
    ? Math.min(downstream.typicalLatency, TIMEOUT_MS)
    : downstream.typicalLatency;
  const capacity = requestsServedPerTick(holdMs);
  const served = queue.take(capacity);
  const queueWaitMs = (queue.depth / capacity) * 250;

  let succeeded = 0;
  let downstreamCalls = 0;
  const latencies = [];
  for (let i = 0; i < served; i++) {
    const r = request(downstream, protections, tick, random);
    if (r.ok) succeeded++;
    downstreamCalls += r.calls;
    latencies.push(queueWaitMs + r.ms);
  }
  latencies.sort((a, b) => a - b);
  const p99 = latencies.length ? latencies[Math.floor(latencies.length * 0.99)] : 0;
  const successPercent = served + shed ? (100 * succeeded) / (served + shed) : 0;
  chart.push(successPercent, downstreamCalls);
  latencyChart.push(p99);
  st.setAll({
    ok: successPercent.toFixed(0) + "%",
    p99: p99.toFixed(0),
    load: downstreamCalls,
    queue: queue.depth,
  });
  const level = { open: "bad", "half-open": "warn", closed: "ok" }[breaker.state];
  st.set("breaker", useBreaker.value ? breaker.state : "off", useBreaker.value ? level : "muted");
}, 250);
log.add(
  "Try: failure 60% with retries on and breaker off (load triples), then turn the breaker on.",
  "muted",
);
