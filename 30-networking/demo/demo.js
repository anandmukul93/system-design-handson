// Networking: DNS resolution with caching, head-of-line blocking, protobuf varints. Edit me and press Run.
K.title(
  "Networking fundamentals",
  "Resolve a name step by step, compare HTTP/1.1, HTTP/2 and HTTP/3 on a lossy link, and see varint bytes.",
);

// ---- DNS ----
K.section("1. DNS resolution");
const name = K.text("Name", "api.shop.example.com", null, 220);
const ttl = K.slider("TTL (s)", 5, 300, 60, 5);
K.button("Resolve", resolve, "primary");
K.button("Advance clock 60 s", () => {
  now += 60;
  log.add(`clock is now ${now}s`, "muted");
});
const dst = K.stats({ ms: "Latency", hops: "Queries sent", cache: "Answered from" });
const log = K.log(110);
let now = 0;
const cache = new Map();
function resolve() {
  const n = name.value.trim().replace(/\.$/, "");
  const c = cache.get(n);
  if (c && c.exp > now) {
    dst.setAll({ ms: "1 ms", hops: 0, cache: `resolver cache (expires in ${c.exp - now}s)` });
    return log.add(`${n} → ${c.ip} (cached)`, "ok");
  }
  const labels = n.split("."),
    steps = [
      ["root .", 20],
      [`.${labels.at(-1)} TLD`, 25],
      [`${labels.slice(-2).join(".")} authoritative`, 30],
    ];
  let ms = 2;
  log.add(`stub → recursive resolver: ${n}?`, "muted");
  for (const [who, t] of steps) {
    ms += t;
    log.add(
      `  resolver → ${who}: ${who.startsWith("root") ? "referral to TLD" : who.includes("TLD") ? "referral to authoritative NS" : "A record"} (${t} ms)`,
    );
  }
  const ip = `203.0.113.${K.hash(n) % 250}`;
  cache.set(n, { ip, exp: now + ttl.value });
  dst.setAll({ ms: ms + " ms", hops: steps.length, cache: "authoritative (now cached " + ttl.value + "s)" });
  log.add(`${n} → ${ip}`, "ok");
}

// ---- HOL blocking ----
K.section("2. Six streams over one lossy link");
const loss = K.slider("Packet loss %", 0, 10, 2, 0.5, () => hol());
const rtt = K.slider("RTT (ms)", 10, 200, 60, 10, () => hol());
const hst = K.stats({ h1: "HTTP/1.1 (6 conns)", h2: "HTTP/2 over TCP", h3: "HTTP/3 over QUIC" });
const bars = K.bars(130);
function hol() {
  const rnd = K.rng(30),
    streams = 6,
    pkts = 20,
    trials = 200;
  let t1 = 0,
    t2 = 0,
    t3 = 0;
  for (let k = 0; k < trials; k++) {
    // each lost packet costs one RTT of retransmission for whatever is blocked behind it
    const lost = Array.from(
      { length: streams },
      () => Array.from({ length: pkts }, () => rnd() * 100 < loss.value).filter(Boolean).length,
    );
    t1 += 2 * rtt.value + Math.max(...lost.map((l) => ((pkts / 2 + l) * rtt.value) / 4)); // 6 parallel TCP conns, extra handshake RTT
    const all = lost.reduce((a, b) => a + b, 0);
    t2 += rtt.value + (((pkts * streams) / 12) * rtt.value) / 4 + all * rtt.value; // one TCP: every loss stalls all streams
    t3 += rtt.value * 0.5 + (((pkts * streams) / 12) * rtt.value) / 4 + Math.max(...lost) * rtt.value; // QUIC: loss stalls only its stream, 0/1-RTT setup
  }
  const v = [t1, t2, t3].map((t) => Math.round(t / trials));
  hst.setAll({ h1: v[0] + " ms", h2: v[1] + " ms", h3: v[2] + " ms" });
  bars.draw([
    { label: "HTTP/1.1", value: v[0], color: 0 },
    { label: "HTTP/2", value: v[1], color: 1 },
    { label: "HTTP/3", value: v[2], color: 2 },
  ]);
}
hol();

// ---- varint ----
K.section("3. Protobuf varint");
const num = K.text("Number", "300", () => varint(), 140);
const out = K.code("");
function varint() {
  let n = BigInt(num.value.replace(/[^0-9]/g, "") || "0");
  const bytes = [];
  do {
    let b = Number(n & 0x7fn);
    n >>= 7n;
    if (n) b |= 0x80;
    bytes.push(b);
  } while (n);
  out.set(
    bytes.map((b) => b.toString(2).padStart(8, "0")).join(" ") +
      "\n" +
      bytes.map((b) => "0x" + b.toString(16).padStart(2, "0")).join(" ") +
      `\n${bytes.length} byte(s): low 7 bits first, top bit = "more bytes follow". A fixed int64 would take 8.`,
  );
}
varint();
