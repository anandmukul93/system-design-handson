// One CDN edge location. Three outcomes per request, decided by the age of the cached copy:
//   age <= ttl               fresh hit: serve from the edge
//   age <= ttl + swr         stale-while-revalidate: serve the old copy now, refresh from origin in the background
//   otherwise                miss: the user waits for the origin
export class EdgeCache {
  constructor(origin) {
    this.origin = origin;
    this.entries = new Map(); // path -> { version, tag, storedAt }
  }
  // returns { served: "hit" | "swr" | "miss", outdated: boolean }  (outdated = not the origin's current version)
  request(page, now, { ttl, swr }) {
    const entry = this.entries.get(page.path);
    const age = entry ? now - entry.storedAt : Infinity;
    if (age <= ttl) return { served: "hit", outdated: entry.version !== page.version };
    if (age <= ttl + swr) {
      this.store(page, now); // background refresh: the next user gets the new copy
      return { served: "swr", outdated: entry.version !== page.version };
    }
    this.store(page, now);
    return { served: "miss", outdated: false };
  }
  store(page, now) {
    this.entries.set(page.path, { ...this.origin.fetch(page), storedAt: now });
  }
  purgeTag(tag) {
    for (const [path, entry] of this.entries) if (entry.tag === tag) this.entries.delete(path);
  }
}
