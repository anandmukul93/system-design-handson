// Circuit breaker: after too many failures, stop calling for a while and fail fast instead.
//   closed     calls go through; outcomes are remembered in a sliding window
//   open       calls are refused immediately until the cool-down ends
//   half-open  one probe call is allowed: success closes the breaker, failure opens it again
export class CircuitBreaker {
  constructor({ windowSize = 20, failureRatio = 0.5, openTicks = 12, onChange = () => {} } = {}) {
    this.windowSize = windowSize;
    this.failureRatio = failureRatio;
    this.openTicks = openTicks;
    this.onChange = onChange; // (newState) => void
    this.state = "closed";
    this.openUntil = 0;
    this.outcomes = []; // last `windowSize` results, true = success
  }
  setState(state) {
    if (state !== this.state) this.onChange(state);
    this.state = state;
  }
  // may this call go out?
  allow(now) {
    if (this.state !== "open") return true;
    if (now < this.openUntil) return false;
    this.setState("half-open");
    return true;
  }
  record(success, now) {
    this.outcomes.push(success);
    if (this.outcomes.length > this.windowSize) this.outcomes.shift();
    if (success) {
      if (this.state === "half-open") this.setState("closed");
      return;
    }
    const failures = this.outcomes.filter((ok) => !ok).length;
    const windowIsBad =
      this.outcomes.length >= this.windowSize && failures >= this.windowSize * this.failureRatio;
    if (this.state === "half-open" || windowIsBad) {
      this.setState("open");
      this.openUntil = now + this.openTicks;
    }
  }
}
