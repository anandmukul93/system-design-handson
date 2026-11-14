// Drives any strategy forward one stage at a time, and guards it with automated analysis:
// if the error rate over the last few ticks breaks the limit, roll back by itself.
const TICKS_PER_STAGE = 6;
const ERROR_WINDOW = 6;
export const ERROR_LIMIT_PERCENT = 2;

export class Rollout {
  constructor(size) {
    this.size = size;
    this.reset();
  }
  reset() {
    this.state = { instances: Array(this.size).fill("v1"), green: null, v2TrafficPercent: 0 };
    this.phase = "idle"; // idle | deploying | done | rolled back
    this.strategy = null;
    this.ticks = 0;
    this.errorSamples = [];
  }
  start(strategy) {
    this.reset();
    this.strategy = strategy;
    this.phase = "deploying";
  }
  get errorRate() {
    const n = this.errorSamples.length;
    return n ? this.errorSamples.reduce((a, b) => a + b, 0) / n : 0;
  }
  get v2Instances() {
    return [...this.state.instances, ...(this.state.green || [])].filter((v) => v === "v2").length;
  }
  // call once per tick with the error % just observed. returns [{ text, kind }]
  tick(observedErrorPercent) {
    const events = [];
    this.ticks++;
    this.errorSamples.push(observedErrorPercent);
    if (this.errorSamples.length > ERROR_WINDOW) this.errorSamples.shift();
    if (this.phase !== "deploying") return events;

    if (this.errorRate > ERROR_LIMIT_PERCENT && this.state.v2TrafficPercent > 0) {
      const rate = this.errorRate.toFixed(1);
      this.state = { instances: Array(this.size).fill("v1"), green: null, v2TrafficPercent: 0 };
      this.phase = "rolled back";
      events.push({
        text: `error rate ${rate}% > ${ERROR_LIMIT_PERCENT}% guard → automatic rollback`,
        kind: "bad",
      });
    } else if (this.ticks % TICKS_PER_STAGE === 0) {
      if (this.strategy.isComplete(this.state)) {
        // the last stage has soaked without tripping the guard
        this.state = { instances: Array(this.size).fill("v2"), green: null, v2TrafficPercent: 100 };
        this.phase = "done";
        events.push({ text: "v2 fully released", kind: "ok" });
      } else {
        const text = this.strategy.advance(this.state);
        if (text) events.push({ text, kind: "muted" });
      }
    }
    return events;
  }
}
