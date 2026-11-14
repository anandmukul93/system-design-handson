// Event-time aggregation: tumbling windows, a watermark that closes them, dedupe by event id,
// and a side output for events that arrive after their window closed.
export class WindowAggregator {
  constructor(windowSeconds) {
    this.size = windowSeconds;
    this.windows = new Map(); // window start -> { counts: { ad: n }, closed }
    this.seenIds = new Set();
    this.maxEventTime = 0;
    this.counts = { received: 0, duplicates: 0, late: 0, closed: 0 };
  }
  windowStart(eventTime) {
    return Math.floor(eventTime / this.size) * this.size;
  }
  watermark(allowedLateness) {
    // "we believe no event older than this is still on its way"
    return this.maxEventTime - allowedLateness;
  }

  // returns "counted" | "duplicate" | "late"
  add(event, allowedLateness) {
    this.counts.received++;
    if (this.seenIds.has(event.id)) {
      this.counts.duplicates++;
      return "duplicate";
    }
    this.seenIds.add(event.id);
    const start = this.windowStart(event.eventTime);
    const existing = this.windows.get(start);
    const alreadyClosed = existing ? existing.closed : start + this.size <= this.watermark(allowedLateness);
    this.maxEventTime = Math.max(this.maxEventTime, event.eventTime);
    if (alreadyClosed) {
      this.counts.late++;
      return "late";
    }
    const win = existing || { counts: {}, closed: false };
    this.windows.set(start, win);
    win.counts[event.ad] = (win.counts[event.ad] || 0) + 1;
    return "counted";
  }

  // close every window whose end the watermark has passed. Returns the starts of the windows just closed.
  advance(allowedLateness) {
    const watermark = this.watermark(allowedLateness);
    const closedNow = [];
    for (const [start, win] of this.windows) {
      if (!win.closed && start + this.size <= watermark) {
        win.closed = true;
        this.counts.closed++;
        closedNow.push(start);
      }
      if (start < watermark - 60) this.windows.delete(start); // old results have been emitted downstream
    }
    return closedNow;
  }

  topAds(start, n) {
    return Object.entries(this.windows.get(start).counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n);
  }
}
