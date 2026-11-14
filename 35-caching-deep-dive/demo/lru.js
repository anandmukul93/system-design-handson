// LRU cache: when full, evict the key that was used least recently.
// A JavaScript Map remembers insertion order, so "delete then set" moves a key to the most-recent end.
export class LruCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.map = new Map();
  }
  // returns { hit: boolean, evicted?: key }
  access(key) {
    if (this.map.has(key)) {
      this.map.delete(key);
      this.map.set(key, true);
      return { hit: true };
    }
    this.map.set(key, true);
    if (this.map.size <= this.capacity) return { hit: false };
    const evicted = this.map.keys().next().value; // the oldest entry
    this.map.delete(evicted);
    return { hit: false, evicted };
  }
  // least recent first
  keys() {
    return [...this.map.keys()];
  }
}
