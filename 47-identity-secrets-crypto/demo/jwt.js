// JWTs signed with ES256 (real WebCrypto), with key rotation. A token is header.payload.signature.
// The header names the key id (kid) that signed it; verifiers look that key up in the published key set.
import { toBytes, toText, base64url, fromBase64url } from "./encoding.js";

const ALGORITHM = { name: "ECDSA", hash: "SHA-256" };

export class TokenIssuer {
  constructor() {
    this.keys = {}; // kid -> key pair. The public halves are what a JWKS endpoint publishes.
    this.activeKid = null;
    this.count = 0;
  }
  // add a new signing key. Old keys stay published so tokens they signed keep verifying.
  async rotate() {
    const kid = "k" + ++this.count;
    this.keys[kid] = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, false, [
      "sign",
      "verify",
    ]);
    this.activeKid = kid;
    return kid;
  }
  // remove the oldest key that is not the active one; returns its kid or null
  retireOldest() {
    const kid = Object.keys(this.keys).find((k) => k !== this.activeKid);
    if (kid) delete this.keys[kid];
    return kid || null;
  }
  async issue(claims) {
    const header = base64url(toBytes(JSON.stringify({ alg: "ES256", kid: this.activeKid })));
    const payload = base64url(toBytes(JSON.stringify(claims)));
    const key = this.keys[this.activeKid].privateKey;
    const signature = await crypto.subtle.sign(ALGORITHM, key, toBytes(`${header}.${payload}`));
    return `${header}.${payload}.${base64url(signature)}`;
  }
  // returns { kid, payload, result: "valid" | "bad signature" | "unknown kid" }
  async verify(token) {
    const [header, payload, signature] = token.split(".");
    const { kid } = JSON.parse(toText(fromBase64url(header)));
    const info = { kid, payload: toText(fromBase64url(payload)) };
    const key = this.keys[kid];
    if (!key) return { ...info, result: "unknown kid" };
    const signedPart = toBytes(`${header}.${payload}`);
    const ok = await crypto.subtle.verify(ALGORITHM, key.publicKey, fromBase64url(signature), signedPart);
    return { ...info, result: ok ? "valid" : "bad signature" };
  }
}

// what an attacker would try: edit the payload and keep the old signature
export function tamperWithPayload(token, find, replaceWith) {
  const [header, payload, signature] = token.split(".");
  const edited = toText(fromBase64url(payload)).replace(find, replaceWith);
  return `${header}.${base64url(toBytes(edited))}.${signature}`;
}
