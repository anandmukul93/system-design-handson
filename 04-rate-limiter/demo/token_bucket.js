// Token bucket: tokens refill at a steady rate; each request spends one. Allows bursts up to the bucket size.
export class TokenBucket {
  constructor(limit, windowSeconds) {
    this.capacity = limit;
    this.refillPerSecond = limit / windowSeconds;
    this.tokens = limit;
    this.last = 0;
  }
  allow(now) {
    this.tokens = Math.min(this.capacity, this.tokens + (now - this.last) * this.refillPerSecond);
    this.last = now;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
  describe() {
    return `tokens ${this.tokens.toFixed(1)}`;
  }
}
