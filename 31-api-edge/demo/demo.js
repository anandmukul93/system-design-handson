// API gateway playground: version routing, smooth weighted round robin, webhook signatures. Edit me and press Run.
K.title(
  "API gateway and edge",
  "Route by path and version header, balance with smooth weighted round-robin, and verify signed webhooks.",
);

// ---- routing ----
K.section("1. Routing");
const path = K.text("Path", "/orders/42", null, 160);
const ver = K.select("API-Version header", ["(none)", "2025-01-01", "2026-06-01"], "(none)");
K.button("Send", route, "primary");
const rlog = K.log(80);
const ROUTES = [
  { prefix: "/orders", pick: (v) => (v >= "2026-01-01" ? "orders-v2" : "orders-v1") },
  { prefix: "/users", pick: () => "users-v1" },
];
function route() {
  const r = ROUTES.find((x) => path.value.startsWith(x.prefix));
  if (!r) return rlog.add(`${path.value} → 404 (no route)`, "bad");
  const v = ver.value === "(none)" ? "2025-01-01" : ver.value;
  rlog.add(
    `${path.value} [${ver.value === "(none)" ? "default 2025-01-01" : v}] → ${r.pick(v)}  · auth ✓ · rate limit ✓ · request-id added`,
    "ok",
  );
}

// ---- smooth weighted round robin ----
K.section("2. Smooth weighted round-robin");
const ws = {
  a: K.slider("Weight of a", 0, 10, 5, 1, () => wrr()),
  b: K.slider("Weight of b", 0, 10, 1, 1, () => wrr()),
  c: K.slider("Weight of c", 0, 10, 1, 1, () => wrr()),
};
const seq = K.code("");
function wrr() {
  const cur = { a: 0, b: 0, c: 0 },
    total = Object.values(ws).reduce((s, x) => s + x.value, 0),
    out = [];
  if (!total) return seq.set("all weights are 0");
  for (let i = 0; i < 14; i++) {
    for (const k in cur) cur[k] += ws[k].value; // everyone gains their weight
    const best = Object.keys(cur).reduce((x, y) => (cur[y] > cur[x] ? y : x));
    cur[best] -= total;
    out.push(best); // winner pays the total
  }
  seq.set(
    out.join(" ") + "\n(no long runs of the same backend, unlike naive weighted round-robin: a a a a a b c)",
  );
}
wrr();

// ---- webhooks ----
K.section("3. Signed webhooks (HMAC-SHA256)");
const body = K.text("Body", '{"event":"payment.succeeded","id":"evt_1"}', null, 320);
const age = K.slider("Delivered after (s)", 0, 900, 5, 5);
const tamper = K.toggle("Attacker edits the body in transit", false);
K.button("Sign and deliver", deliver, "primary");
const wlog = K.log(90);
const SECRET = "whsec_demo_secret";
const seen = new Set();
async function hmac(msg) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function deliver() {
  const ts = Math.floor(Date.now() / 1000) - age.value;
  const sig = await hmac(`${ts}.${body.value}`);
  const received = tamper.value ? body.value.replace("succeeded", "refunded") : body.value;
  const expect = await hmac(`${ts}.${received}`);
  const id = (received.match(/"id":"([^"]+)"/) || [])[1];
  if (expect !== sig) return wlog.add(`signature mismatch: body was modified → 400`, "bad");
  if (Date.now() / 1000 - ts > 300)
    return wlog.add(`timestamp is ${age.value}s old (> 300s tolerance): possible replay → 400`, "bad");
  if (seen.has(id))
    return wlog.add(`event ${id} already processed: ack 200 but do nothing (idempotent)`, "warn");
  seen.add(id);
  wlog.add(`t=${ts}, v1=${sig.slice(0, 16)}… verified → processed ${id}`, "ok");
}
