// SLI, SLO, error budget and burn rate.
//   SLI  what we measure: the share of good requests (ok and fast enough)
//   SLO  the target for it, e.g. 99%. The remaining 1% is the error budget.
//   burn rate  how fast the budget is being spent: 1x uses exactly the whole budget over the 30-day window
const WINDOW_MINUTES = 5;
const MINUTES_IN_30_DAYS = 43200;
export const FAST_BURN = 14.4; // page someone: 2% of the monthly budget gone in an hour
export const SLOW_BURN = 6; // open a ticket

export class SloTracker {
  constructor() {
    this.recent = []; // good fraction per minute
    this.budgetSpent = 0; // fraction of the 30-day budget
  }
  // record one minute; returns { sliPercent, burnRate, budgetLeftPercent, alert }
  record(goodFraction, sloPercent) {
    this.recent.push(goodFraction);
    if (this.recent.length > WINDOW_MINUTES) this.recent.shift();
    const sli = this.recent.reduce((a, b) => a + b, 0) / this.recent.length;
    const allowedBad = 1 - sloPercent / 100;
    this.budgetSpent += (1 - goodFraction) / (allowedBad * MINUTES_IN_30_DAYS);
    const burnRate = (1 - sli) / allowedBad;
    let alert = "none";
    if (burnRate > SLOW_BURN) alert = "ticket";
    if (burnRate > FAST_BURN) alert = "page";
    return {
      sliPercent: 100 * sli,
      burnRate,
      budgetLeftPercent: Math.max(0, 100 - 100 * this.budgetSpent),
      alert,
    };
  }
}
