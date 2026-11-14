// Sliding window log: remember the timestamp of every accepted request. Exact, but O(limit) memory per client.
export class SlidingLog {
  constructor(limit, windowSeconds) {
    this.limit = limit;
    this.window = windowSeconds;
    this.timestamps = [];
  }
  allow(now) {
    while (this.timestamps.length && this.timestamps[0] <= now - this.window) this.timestamps.shift();
    if (this.timestamps.length >= this.limit) return false;
    this.timestamps.push(now);
    return true;
  }
  describe() {
    return `log ${this.timestamps.length}`;
  }
}
