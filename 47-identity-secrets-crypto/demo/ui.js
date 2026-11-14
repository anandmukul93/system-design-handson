// UI only: four panels for tokens, envelope encryption, PKCE and IAM.
import { base64url } from "./encoding.js";
import { TokenIssuer, tamperWithPayload } from "./jwt.js";
import { Kms, encrypt, decrypt } from "./envelope.js";
import { createVerifierAndChallenge, verifierMatches } from "./pkce.js";
import { evaluate } from "./iam.js";

K.title(
  "Identity, secrets and crypto",
  "Real WebCrypto: sign JWTs, rotate keys, tamper, envelope-encrypt, run PKCE and evaluate IAM policies.",
);

// ---- 1. JWT + rotation ----
K.section("1. JWTs and key rotation (ES256)");
const issuer = new TokenIssuer();
const tokens = [];
const subject = K.text("sub", "user-42", null, 120);
K.button("Rotate: new signing key", rotate);
K.button("Issue token", issue, "primary");
K.button("Retire oldest key", () => {
  const kid = issuer.retireOldest();
  if (!kid) return;
  tokenLog.add(`retired ${kid}: tokens signed with it no longer verify`, "warn");
  showTokens();
});
const tamper = K.toggle("Tamper: change the role claim to admin", false, () => showTokens());
const tokenTable = K.table(["Token (kid)", "Payload", "Verifies?"]);
const tokenLog = K.log(60);
async function rotate() {
  const kid = await issuer.rotate();
  tokenLog.add(`now signing with ${kid}; JWKS publishes ${Object.keys(issuer.keys).join(", ")}`, "ok");
  showTokens();
}
async function issue() {
  const expires = Math.floor(Date.now() / 1000) + 3600;
  tokens.push(await issuer.issue({ sub: subject.value, role: "reader", exp: expires }));
  showTokens();
}
async function showTokens() {
  const rows = [];
  for (const token of tokens) {
    const presented = tamper.value ? tamperWithPayload(token, '"reader"', '"admin"') : token;
    const v = await issuer.verify(presented);
    rows.push([
      `${token.slice(0, 18)}… (${v.kid})`,
      v.payload,
      K.chip(v.result, v.result === "valid" ? "ok" : "bad"),
    ]);
  }
  tokenTable.set(rows);
}

// ---- 2. envelope encryption ----
K.section("2. Envelope encryption (AES-GCM)");
const kms = new Kms();
const secret = K.text("Secret", "db-password=hunter2", null, 240);
K.button("Encrypt", showEnvelope, "primary");
const envelopeOut = K.code("");
async function showEnvelope() {
  const envelope = await encrypt(kms, secret.value);
  const roundTrip = await decrypt(kms, envelope);
  envelopeOut.set(
    [
      `ciphertext   ${base64url(envelope.ciphertext)}`,
      `wrapped DEK  ${base64url(envelope.wrappedKey.wrapped)}  (store next to the data)`,
      "KEK          never leaves the KMS",
      `decrypt      unwrap DEK with KEK → "${roundTrip}"`,
    ].join("\n"),
  );
}

// ---- 3. PKCE ----
K.section("3. PKCE");
K.button("Run the flow", showPkce, "primary");
const pkceLog = K.log(110);
async function showPkce() {
  pkceLog.clear();
  const { verifier, challenge } = await createVerifierAndChallenge();
  pkceLog.add(`1. app makes code_verifier = ${verifier.slice(0, 20)}… and keeps it secret`);
  pkceLog.add(`2. /authorize?code_challenge=${challenge.slice(0, 20)}…&method=S256`);
  pkceLog.add(
    "3. user logs in; the redirect carries ?code=abc123 (an attacker could intercept this)",
    "warn",
  );
  const attacker = (await verifierMatches("guess", challenge)) ? "token" : "rejected";
  pkceLog.add(`4. attacker posts the code without the verifier → ${attacker}`, "bad");
  const app = (await verifierMatches(verifier, challenge)) ? "access token issued" : "rejected";
  pkceLog.add(`5. app posts code + code_verifier → server hashes it, matches the challenge → ${app}`, "ok");
}

// ---- 4. IAM ----
K.section("4. IAM policy evaluation");
const EXAMPLE_POLICY = [
  { effect: "Allow", action: "s3:Get*", resource: "bucket/reports/*" },
  { effect: "Deny", action: "s3:*", resource: "bucket/reports/secret/*" },
];
const policy = K.textarea(JSON.stringify(EXAMPLE_POLICY, null, 1), 5);
const action = K.text("Action", "s3:GetObject", null, 140);
const resource = K.text("Resource", "bucket/reports/secret/q3.pdf", null, 240);
K.button("Evaluate", showIam, "primary");
const iamOut = K.code("");
function showIam() {
  let statements;
  try {
    statements = JSON.parse(policy.value);
  } catch (e) {
    return iamOut.set("bad JSON: " + e.message);
  }
  const r = evaluate(statements, action.value, resource.value);
  const listed = r.matching.map((s) => "  " + JSON.stringify(s)).join("\n");
  iamOut.set(
    `matching statements: ${r.matching.length}\n${listed}\n→ ${r.allowed ? "ALLOW" : "DENY"} (${r.reason})`,
  );
}
showIam();
rotate().then(issue);
