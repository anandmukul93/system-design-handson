// A small LRU cache: a Map keeps insertion order, so the first key is always the least recently used.
export class LruCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  has(key) {
    return this.map.has(key);
  }
  get(key) {
    if (!this.map.has(key)) return undefined;
    const value = this.map.get(key);
    this.map.delete(key); // re-insert to mark as most recently used
    this.map.set(key, value);
    return value;
  }
  // returns the evicted key, if any
  set(key, value) {
    this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size <= this.capacity) return null;
    const oldest = this.map.keys().next().value;
    this.map.delete(oldest);
    return oldest;
  }
}
