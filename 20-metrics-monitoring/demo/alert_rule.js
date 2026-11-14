// An alert rule with a "for" duration: inactive → pending (condition true) → firing (true for long enough).
export class AlertRule {
  constructor() {
    this.state = "inactive";
    this.secondsAbove = 0;
  }
  // call once per evaluation (one second). Returns { state, changedFrom } (changedFrom is null if unchanged).
  evaluate(value, threshold, forSeconds) {
    this.secondsAbove = value > threshold ? this.secondsAbove + 1 : 0;
    const next =
      this.secondsAbove === 0 ? "inactive" : this.secondsAbove >= forSeconds ? "firing" : "pending";
    const changedFrom = next !== this.state ? this.state : null;
    this.state = next;
    return { state: next, changedFrom };
  }
}
