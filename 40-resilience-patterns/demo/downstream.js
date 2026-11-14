// The flaky dependency everyone calls. It fails some of the time, is sometimes slow, and can go down entirely.
export class Downstream {
  constructor(random) {
    this.random = random;
    this.failurePercent = 10;
    this.latencyMs = 80;
    this.outageTicks = 0;
  }
  get typicalLatency() {
    return this.outageTicks ? 3000 : this.latencyMs;
  }
  // returns { ok, ms }
  call() {
    const ms = this.typicalLatency * (0.5 + this.random());
    const failed = this.random() * 100 < (this.outageTicks ? 100 : this.failurePercent);
    return { ok: !failed, ms };
  }
}
