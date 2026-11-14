// UI only: three panels for DNS, HTTP versions and varints.
import { DnsResolver } from "./dns_resolver.js";
import { http1, http2, http3, compare } from "./http_versions.js";
import { encodeVarint, decodeVarint } from "./varint.js";

K.title(
  "Networking fundamentals",
  "Resolve a name step by step, compare HTTP/1.1, HTTP/2 and HTTP/3 on a lossy link, and see varint bytes.",
);

// ---- DNS ----
K.section("1. DNS resolution");
const resolver = new DnsResolver(K.hash);
let now = 0;
const name = K.text("Name", "api.shop.example.com", null, 220);
const ttl = K.slider("TTL (s)", 5, 300, 60, 5);
K.button("Resolve", resolve, "primary");
K.button("Advance clock 60 s", () => {
  now += 60;
  log.add(`clock is now ${now}s`, "muted");
});
const dnsStats = K.stats({ ms: "Latency", hops: "Queries sent", cache: "Answered from" });
const log = K.log(110);
function resolve() {
  const r = resolver.resolve(name.value, now, ttl.value);
  if (!r.cached) log.add(`stub → recursive resolver: ${name.value}?`, "muted");
  for (const s of r.steps) log.add(`  resolver → ${s.server}: ${s.answer} (${s.ms} ms)`);
  log.add(`${name.value} → ${r.ip}${r.cached ? " (cached)" : ""}`, "ok");
  dnsStats.setAll({
    ms: r.latencyMs + " ms",
    hops: r.steps.length,
    cache: r.cached
      ? `resolver cache (expires in ${r.expiresIn}s)`
      : `authoritative (now cached ${ttl.value}s)`,
  });
}

// ---- HTTP versions ----
K.section("2. Six streams over one lossy link");
const loss = K.slider("Packet loss %", 0, 10, 2, 0.5, () => showHttp());
const rtt = K.slider("RTT (ms)", 10, 200, 60, 10, () => showHttp());
const httpStats = K.stats({ h1: "HTTP/1.1 (6 conns)", h2: "HTTP/2 over TCP", h3: "HTTP/3 over QUIC" });
const bars = K.bars(130);
function showHttp() {
  const [t1, t2, t3] = compare([http1, http2, http3], loss.value, rtt.value, K.rng(30));
  httpStats.setAll({ h1: t1 + " ms", h2: t2 + " ms", h3: t3 + " ms" });
  bars.draw([
    { label: "HTTP/1.1", value: t1, color: 0 },
    { label: "HTTP/2", value: t2, color: 1 },
    { label: "HTTP/3", value: t3, color: 2 },
  ]);
}
showHttp();

// ---- varint ----
K.section("3. Protobuf varint");
const number = K.text("Number", "300", () => showVarint(), 140);
const out = K.code("");
function showVarint() {
  const bytes = encodeVarint(number.value.replace(/[^0-9]/g, "") || "0");
  out.set(
    [
      bytes.map((b) => b.toString(2).padStart(8, "0")).join(" "),
      bytes.map((b) => "0x" + b.toString(16).padStart(2, "0")).join(" "),
      `${bytes.length} byte(s), decodes back to ${decodeVarint(bytes)}. A fixed int64 would take 8.`,
    ].join("\n"),
  );
}
showVarint();
