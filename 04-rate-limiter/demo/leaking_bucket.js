// Leaking bucket: requests fill a queue that drains at a fixed rate. Smooths output; a full queue rejects.
export class LeakingBucket {
  constructor(limit, windowSeconds) {
    this.capacity = limit;
    this.leakPerSecond = limit / windowSeconds;
    this.level = 0;
    this.last = 0;
  }
  allow(now) {
    this.level = Math.max(0, this.level - (now - this.last) * this.leakPerSecond);
    this.last = now;
    if (this.level + 1 > this.capacity) return false;
    this.level += 1;
    return true;
  }
  describe() {
    return `queue ${this.level.toFixed(1)}`;
  }
}
