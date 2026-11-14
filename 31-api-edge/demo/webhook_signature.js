// Signed webhooks: the sender signs "timestamp.body" with a shared secret (HMAC-SHA256).
// The receiver recomputes the signature, rejects old timestamps (replay) and dedupes by event id.
export const TOLERANCE_SECONDS = 300;

export async function sign(secret, timestamp, body) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export class WebhookReceiver {
  constructor(secret) {
    this.secret = secret;
    this.seen = new Set(); // event ids already processed
  }
  // returns { status, outcome: "processed" | "duplicate" | "bad-signature" | "too-old", eventId? }
  async receive({ timestamp, body, signature }, nowSeconds) {
    if ((await sign(this.secret, timestamp, body)) !== signature)
      return { status: 400, outcome: "bad-signature" };
    if (nowSeconds - timestamp > TOLERANCE_SECONDS) return { status: 400, outcome: "too-old" };
    const eventId = (body.match(/"id":"([^"]+)"/) || [])[1];
    if (this.seen.has(eventId)) return { status: 200, outcome: "duplicate", eventId };
    this.seen.add(eventId);
    return { status: 200, outcome: "processed", eventId };
  }
}
