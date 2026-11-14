// A service that caches something on every request. Without a bound, the cache is a memory leak the GC
// cannot fix: everything in it is still reachable. Pauses grow with the amount of live data.
const BASE_HEAP_MB = 50;
const MB_PER_ENTRY = 0.01;

export class CachingService {
  constructor(maxEntries = Infinity) {
    this.maxEntries = maxEntries; // Infinity = unbounded; a number = LRU-style bound
    this.entries = 0;
  }
  // handle a burst of requests; returns { heapMb, pauseMs }
  serve(requests, random) {
    this.entries = Math.min(this.maxEntries, this.entries + requests);
    const liveMb = BASE_HEAP_MB + this.entries * MB_PER_ENTRY;
    const garbageMb = 30 + random() * 20; // short-lived request objects
    const heapMb = liveMb + garbageMb;
    const pauseMs = 2 + liveMb * 0.08 + (heapMb > 400 ? 40 : 0); // old-generation cost grows with the live set
    return { heapMb, pauseMs };
  }
}
