// The service: create short links and resolve them cache-aside, modelling 301 vs 302 browser behaviour.
import { LruCache } from "./lru_cache.js";

export class Shortener {
  constructor(cacheSize = 4) {
    this.db = new Map(); // code -> long url
    this.cache = new LruCache(cacheSize);
    this.browser = new Set(); // codes this browser cached after a 301
    this.counts = { hits: 0, misses: 0, dbReads: 0, servedByBrowser: 0 };
  }
  // strategy is anything with makeCode(longUrl, isTaken)
  create(longUrl, strategy) {
    const isTaken = (code) => this.db.has(code) && this.db.get(code) !== longUrl;
    const { code, explanation } = strategy.makeCode(longUrl, isTaken);
    this.db.set(code, longUrl);
    return { code, explanation };
  }
  // returns { servedBy: "browser" | "cache" | "db", evicted }
  resolve(code, status) {
    if (status === 301 && this.browser.has(code)) {
      this.counts.servedByBrowser++;
      return { servedBy: "browser", evicted: null };
    }
    let servedBy = "cache";
    let evicted = null;
    if (this.cache.get(code) !== undefined) {
      this.counts.hits++;
    } else {
      this.counts.misses++;
      this.counts.dbReads++;
      evicted = this.cache.set(code, this.db.get(code));
      servedBy = "db";
    }
    if (status === 301) this.browser.add(code);
    else this.browser.clear();
    return { servedBy, evicted };
  }
  // where the NEXT click on this code would be served from
  location(code, status) {
    if (status === 301 && this.browser.has(code)) return "browser";
    return this.cache.has(code) ? "cache" : "db";
  }
}
