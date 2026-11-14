// JWT signing with key rotation, tampering, envelope encryption, PKCE and IAM policy evaluation (WebCrypto). Edit me and press Run.
K.title(
  "Identity, secrets and crypto",
  "Real WebCrypto: sign JWTs, rotate keys, tamper, envelope-encrypt, run PKCE and evaluate IAM policies.",
);

const enc = new TextEncoder(),
  dec = new TextDecoder();
const b64u = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromB64u = (s) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

// ---- JWT + rotation ----
K.section("1. JWTs and key rotation (ES256)");
const keys = {};
let active = null,
  kn = 0;
const sub = K.text("sub", "user-42", null, 120);
K.button("Rotate: new signing key", rotate);
K.button("Issue token", issue, "primary");
K.button("Retire oldest key", () => {
  const k = Object.keys(keys)[0];
  if (k && k !== active) {
    delete keys[k];
    jlog.add(`retired ${k}: tokens signed with it no longer verify`, "warn");
    verifyAll();
  }
});
const tamper = K.toggle("Tamper: change the role claim to admin", false, () => verifyAll());
const tokTable = K.table(["Token (kid)", "Payload", "Verifies?"]);
const jlog = K.log(60);
const tokens = [];
async function rotate() {
  const kid = "k" + ++kn;
  keys[kid] = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
    "sign",
    "verify",
  ]);
  active = kid;
  jlog.add(`now signing with ${kid}; JWKS publishes ${Object.keys(keys).join(", ")}`, "ok");
  verifyAll();
}
async function issue() {
  const h = b64u(enc.encode(JSON.stringify({ alg: "ES256", kid: active }))),
    p = b64u(
      enc.encode(
        JSON.stringify({ sub: sub.value, role: "reader", exp: Math.floor(Date.now() / 1000) + 3600 }),
      ),
    );
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keys[active].privateKey,
    enc.encode(h + "." + p),
  );
  tokens.push(`${h}.${p}.${b64u(sig)}`);
  verifyAll();
}
async function verifyAll() {
  const rows = [];
  for (let t of tokens) {
    let [h, p, s] = t.split(".");
    if (tamper.value) p = b64u(enc.encode(dec.decode(fromB64u(p)).replace('"reader"', '"admin"')));
    const kid = JSON.parse(dec.decode(fromB64u(h))).kid,
      key = keys[kid];
    const ok = key
      ? await crypto.subtle.verify(
          { name: "ECDSA", hash: "SHA-256" },
          key.publicKey,
          fromB64u(s),
          enc.encode(h + "." + p),
        )
      : false;
    rows.push([
      `${t.slice(0, 18)}… (${kid})`,
      dec.decode(fromB64u(p)),
      K.chip(ok ? "valid" : key ? "bad signature" : "unknown kid", ok ? "ok" : "bad"),
    ]);
  }
  tokTable.set(rows);
}

// ---- envelope encryption ----
K.section("2. Envelope encryption (AES-GCM)");
const plain = K.text("Secret", "db-password=hunter2", null, 240);
K.button("Encrypt", envelope, "primary");
const envOut = K.code("");
let kek;
async function envelope() {
  kek ??= await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, false, ["wrapKey", "unwrapKey"]); // lives in the KMS
  const dek = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]); // fresh per object
  const iv = crypto.getRandomValues(new Uint8Array(12)),
    wiv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, dek, enc.encode(plain.value));
  const wrapped = await crypto.subtle.wrapKey("raw", dek, kek, { name: "AES-GCM", iv: wiv });
  const dek2 = await crypto.subtle.unwrapKey(
    "raw",
    wrapped,
    kek,
    { name: "AES-GCM", iv: wiv },
    "AES-GCM",
    false,
    ["decrypt"],
  );
  const back = dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, dek2, ct));
  envOut.set(
    `ciphertext   ${b64u(ct)}\nwrapped DEK  ${b64u(wrapped)}  (store next to the data)\nKEK          never leaves the KMS\ndecrypt      unwrap DEK with KEK → "${back}"`,
  );
}

// ---- PKCE ----
K.section("3. PKCE");
K.button("Run the flow", pkce, "primary");
const pk = K.log(110);
async function pkce() {
  pk.clear();
  const verifier = b64u(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = b64u(await crypto.subtle.digest("SHA-256", enc.encode(verifier)));
  pk.add(`1. app makes code_verifier = ${verifier.slice(0, 20)}… and keeps it secret`);
  pk.add(`2. /authorize?code_challenge=${challenge.slice(0, 20)}…&method=S256`);
  pk.add("3. user logs in; the redirect carries ?code=abc123 (an attacker could intercept this)", "warn");
  const check = async (v) => b64u(await crypto.subtle.digest("SHA-256", enc.encode(v))) === challenge;
  pk.add(
    `4. attacker posts code without the verifier → ${(await check("guess")) ? "token" : "rejected"}`,
    "bad",
  );
  pk.add(
    `5. app posts code + code_verifier → server hashes it, matches the challenge → ${(await check(verifier)) ? "access token issued" : "rejected"}`,
    "ok",
  );
}

// ---- IAM ----
K.section("4. IAM policy evaluation");
const policy = K.textarea(
  JSON.stringify(
    [
      { effect: "Allow", action: "s3:Get*", resource: "bucket/reports/*" },
      { effect: "Deny", action: "s3:*", resource: "bucket/reports/secret/*" },
    ],
    null,
    1,
  ),
  5,
);
const action = K.text("Action", "s3:GetObject", null, 140),
  res = K.text("Resource", "bucket/reports/secret/q3.pdf", null, 240);
K.button("Evaluate", iam, "primary");
const iamOut = K.code("");
function iam() {
  const glob = (g, s) =>
    new RegExp(
      "^" +
        g
          .split("*")
          .map((x) => x.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
          .join(".*") +
        "$",
    ).test(s);
  let ps;
  try {
    ps = JSON.parse(policy.value);
  } catch (e) {
    return iamOut.set("bad JSON: " + e.message);
  }
  const m = ps.filter((p) => glob(p.action, action.value) && glob(p.resource, res.value));
  const verdict = m.some((p) => p.effect === "Deny")
    ? "DENY (explicit deny wins)"
    : m.some((p) => p.effect === "Allow")
      ? "ALLOW"
      : "DENY (implicit: nothing allowed it)";
  iamOut.set(
    `matching statements: ${m.length}\n${m.map((p) => "  " + JSON.stringify(p)).join("\n")}\n→ ${verdict}`,
  );
}
iam();
rotate().then(issue);
