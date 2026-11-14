// A mock payment service provider. It declines some charges, and sometimes charges the card but times out
// before answering. It dedupes by idempotency key: the same key always returns the first result.
export class MockPsp {
  constructor(random) {
    this.random = random;
    this.results = new Map(); // idempotency key -> result
    this.charges = []; // what the PSP actually settled: { key, paymentId, amount }
  }
  // returns { status: "succeeded" | "declined" | "timeout", ref?, replay? }
  charge(key, paymentId, amount, { declinePercent, timeoutPercent }) {
    if (this.results.has(key)) return { ...this.results.get(key), replay: true };
    const roll = this.random() * 100;
    if (roll < declinePercent) return { status: "declined" };
    this.charges.push({ key, paymentId, amount });
    const result = { status: "succeeded", ref: "ch_" + this.charges.length };
    this.results.set(key, result);
    if (roll < declinePercent + timeoutPercent) return { status: "timeout" }; // charged, but we never hear back
    return result;
  }
}
