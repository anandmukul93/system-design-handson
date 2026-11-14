// Timeouts, retries with jitter, circuit breaker, bounded queue against a flaky dependency. Edit me and press Run.
K.title("Resilience patterns", "A client calls a flaky downstream. Turn the protections on and off and watch success, latency and load.");

K.section("Downstream");
const failP = K.slider("Failure %", 0, 100, 10, 1);
const lat = K.slider("Latency (ms)", 10, 2000, 80, 10);
K.button("Outage for 10 s", () => { outage = 40; log.add("downstream outage starts", "bad"); }, "danger");
K.section("Client protections");
const timeout = K.toggle("Timeout at 300 ms", true);
const retries = K.toggle("Retry up to 3x", true);
const jitter = K.toggle("Exponential backoff with jitter", true);
const breaker = K.toggle("Circuit breaker (50% errors over 20 calls)", true);
const bounded = K.toggle("Bounded queue / load shedding", true);
const st = K.stats({ ok: "Success %", p99: "Client p99 (ms)", load: "Downstream calls / tick", cb: "Breaker", queue: "Queue depth" });
const chart = K.chart([{ name: "success %" }, { name: "downstream load" }], { height: 150 });
const lchart = K.chart([{ name: "client latency p99" }], { height: 110 });
const log = K.log(70);
let outage = 0, cb = "closed", cbUntil = 0, recent = [], tick = 0, queue = 0;
const rnd = K.rng(40);
K.loop(() => {
  tick++; outage = Math.max(0, outage - 1);
  const fp = outage ? 100 : failP.value, base = outage ? 3000 : lat.value;
  let ok = 0, calls = 0; const lats = [];
  queue += 20;                                                          // 20 new requests arrive per tick
  let shed = 0;
  if (bounded.value && queue > 60) { shed = queue - 60; queue = 60; }   // reject the excess fast (429)
  // 30 worker threads; a slow downstream holds them longer (a timeout caps that), so throughput drops
  const capacity = Math.max(2, Math.round(30 * Math.min(1, 150 / (timeout.value ? Math.min(base, 300) : base))));
  const served = Math.min(queue, capacity);
  queue -= served;
  for (let i = 0; i < served; i++) {
    let t = (queue / capacity) * 250;                                         // time spent waiting in the queue
    let done = false;
    for (let a = 0; a < (retries.value ? 4 : 1) && !done; a++) {
      if (breaker.value && cb === "open") { if (tick < cbUntil) { t += 1; break; } cb = "half-open"; log.add("breaker half-open: one probe", "warn"); }
      calls++;
      const l = base * (0.5 + rnd()), fail = rnd() * 100 < fp;
      const took = timeout.value ? Math.min(l, 300) : l;
      t += took;
      const success = !fail && (!timeout.value || l <= 300);
      recent.push(success); if (recent.length > 20) recent.shift();
      if (success) { done = true; if (cb === "half-open") { cb = "closed"; log.add("probe ok: breaker closed", "ok"); } break; }
      if (breaker.value && (cb === "half-open" || (recent.length >= 20 && recent.filter((x) => !x).length >= 10))) { if (cb !== "open") log.add("breaker OPEN: failing fast for 3 s", "bad"); cb = "open"; cbUntil = tick + 12; }
      t += jitter.value ? rnd() * 50 * 2 ** a : 50 * 2 ** a;            // without jitter every client retries in lockstep
    }
    if (done) ok++;
    lats.push(t);
  }
  lats.sort((a, b) => a - b);
  const p99 = lats.length ? lats[Math.floor(lats.length * 0.99)] : 0, succ = served + shed ? (100 * ok) / (served + shed) : 0;
  chart.push(succ, calls); lchart.push(p99);
  st.setAll({ ok: succ.toFixed(0) + "%", p99: p99.toFixed(0), load: calls, queue });
  st.set("cb", breaker.value ? cb : "off", cb === "open" ? "bad" : cb === "half-open" ? "warn" : "ok");
}, 250);
log.add("Try: failure 60% with retries on and breaker off (load triples), then turn the breaker on.", "muted");
