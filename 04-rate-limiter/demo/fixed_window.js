// Fixed window counter: one counter per window. Cheap, but 2x the limit can pass around a window boundary.
export class FixedWindow {
  constructor(limit, windowSeconds) {
    this.limit = limit;
    this.window = windowSeconds;
    this.currentWindow = 0;
    this.count = 0;
  }
  allow(now) {
    const w = Math.floor(now / this.window);
    if (w !== this.currentWindow) {
      this.currentWindow = w;
      this.count = 0;
    }
    if (this.count >= this.limit) return false;
    this.count += 1;
    return true;
  }
  describe() {
    return `count ${this.count}`;
  }
}
