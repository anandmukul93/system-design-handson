// The calling service itself: a queue of incoming requests and a fixed pool of worker threads.
// A slow downstream holds each thread longer, so fewer requests get served per tick and the queue grows.
const THREADS = 30;
const FAST_CALL_MS = 150; // at or below this, every thread finishes a request per tick

export function requestsServedPerTick(holdMs) {
  return Math.max(2, Math.round(THREADS * Math.min(1, FAST_CALL_MS / holdMs)));
}

export class RequestQueue {
  constructor() {
    this.depth = 0;
  }
  // add arrivals; with a limit, reject the excess right away (HTTP 429). returns how many were shed
  arrive(count, limit = Infinity) {
    this.depth += count;
    const shed = Math.max(0, this.depth - limit);
    this.depth -= shed;
    return shed;
  }
  take(capacity) {
    const served = Math.min(this.depth, capacity);
    this.depth -= served;
    return served;
  }
}
