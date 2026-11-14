// Sliding window counter: current window count + a weighted share of the previous one. Approximate, O(1) memory.
export class SlidingCounter {
  constructor(limit, windowSeconds) {
    this.limit = limit;
    this.window = windowSeconds;
    this.counts = {}; // window index -> accepted requests
    this.now = 0;
  }
  allow(now) {
    this.now = now;
    const w = Math.floor(now / this.window);
    const elapsedFraction = (now % this.window) / this.window;
    const estimate = (this.counts[w] || 0) + (this.counts[w - 1] || 0) * (1 - elapsedFraction);
    if (estimate + 1 > this.limit) return false;
    this.counts[w] = (this.counts[w] || 0) + 1;
    return true;
  }
  describe() {
    const w = Math.floor(this.now / this.window);
    return `cur ${this.counts[w] || 0} prev ${this.counts[w - 1] || 0}`;
  }
}
