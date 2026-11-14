// UI only: three panels for routing, load balancing and webhook verification.
import { route } from "./router.js";
import { smoothWeightedRoundRobin, naiveWeightedRoundRobin } from "./weighted_round_robin.js";
import { sign, WebhookReceiver, TOLERANCE_SECONDS } from "./webhook_signature.js";

K.title(
  "API gateway and edge",
  "Route by path and version header, balance with smooth weighted round-robin, and verify signed webhooks.",
);

// ---- routing ----
K.section("1. Routing");
const path = K.text("Path", "/orders/42", null, 160);
const version = K.select("API-Version header", ["(none)", "2025-01-01", "2026-06-01"], "(none)");
K.button("Send", send, "primary");
const routeLog = K.log(80);
function send() {
  const r = route(path.value, version.value === "(none)" ? null : version.value);
  if (r.status === 404) return routeLog.add(`${path.value} → 404 (no route)`, "bad");
  const shown = r.defaulted ? `default ${r.version}` : r.version;
  routeLog.add(`${path.value} [${shown}] → ${r.upstream}  · auth ✓ · rate limit ✓ · request-id added`, "ok");
}

// ---- weighted round robin ----
K.section("2. Smooth weighted round-robin");
const weightSliders = {
  a: K.slider("Weight of a", 0, 10, 5, 1, () => showBalance()),
  b: K.slider("Weight of b", 0, 10, 1, 1, () => showBalance()),
  c: K.slider("Weight of c", 0, 10, 1, 1, () => showBalance()),
};
const sequence = K.code("");
function showBalance() {
  const weights = Object.fromEntries(Object.entries(weightSliders).map(([name, s]) => [name, s.value]));
  const smooth = smoothWeightedRoundRobin(weights, 14);
  if (!smooth.length) return sequence.set("all weights are 0");
  sequence.set(`smooth: ${smooth.join(" ")}\nnaive:  ${naiveWeightedRoundRobin(weights, 14).join(" ")}`);
}
showBalance();

// ---- webhooks ----
K.section("3. Signed webhooks (HMAC-SHA256)");
const SECRET = "whsec_demo_secret";
const receiver = new WebhookReceiver(SECRET);
const body = K.text("Body", '{"event":"payment.succeeded","id":"evt_1"}', null, 320);
const age = K.slider("Delivered after (s)", 0, 900, 5, 5);
const tamper = K.toggle("Attacker edits the body in transit", false);
K.button("Sign and deliver", deliver, "primary");
const hookLog = K.log(90);
async function deliver() {
  const nowSeconds = Math.floor(Date.now() / 1000);
  const timestamp = nowSeconds - age.value;
  const signature = await sign(SECRET, timestamp, body.value); // the sender signs the original body
  const received = tamper.value ? body.value.replace("succeeded", "refunded") : body.value;
  const r = await receiver.receive({ timestamp, body: received, signature }, nowSeconds);
  const messages = {
    "bad-signature": ["signature mismatch: body was modified → 400", "bad"],
    "too-old": [
      `timestamp is ${age.value}s old (> ${TOLERANCE_SECONDS}s tolerance): possible replay → 400`,
      "bad",
    ],
    duplicate: [`event ${r.eventId} already processed: ack 200 but do nothing (idempotent)`, "warn"],
    processed: [`t=${timestamp}, v1=${signature.slice(0, 16)}… verified → processed ${r.eventId}`, "ok"],
  };
  hookLog.add(...messages[r.outcome]);
}
