// The crawler: a frontier with one FIFO queue per host, politeness delays, URL + content dedupe, depth limit.
// The web is injected ({ linksOf, contentOf, hostOf }) so this file knows nothing about the fake web or the UI.
export class Crawler {
  constructor(web, hosts, seeds) {
    this.web = web;
    this.queues = Object.fromEntries(hosts.map((h) => [h, []])); // host -> [{ url, depth }]
    this.seenUrls = new Set();
    this.seenContent = new Set();
    this.nextAllowedTick = {}; // host -> tick when we may fetch from it again
    this.tick = 0;
    this.counts = { fetched: 0, duplicateUrls: 0, duplicateContent: 0, cutByDepth: 0 };
    for (const url of seeds) this.enqueue(url, 0, Infinity);
  }

  // returns "queued" | "duplicate" | "too-deep"
  enqueue(url, depth, maxDepth) {
    if (this.seenUrls.has(url)) {
      this.counts.duplicateUrls++;
      return "duplicate";
    }
    if (depth > maxDepth) {
      this.counts.cutByDepth++;
      return "too-deep";
    }
    this.seenUrls.add(url);
    this.queues[this.web.hostOf(url)].push({ url, depth });
    return "queued";
  }

  isThrottled(host) {
    return (this.nextAllowedTick[host] || 0) > this.tick;
  }
  frontierSize() {
    return Object.values(this.queues).reduce((a, q) => a + q.length, 0);
  }

  // one tick: each fetcher takes a URL from a host that is not throttled. Returns a list of events.
  step({ politenessDelay, maxDepth, fetchers }) {
    this.tick++;
    const events = [];
    let used = 0;
    for (const host of Object.keys(this.queues)) {
      if (used >= fetchers) break;
      const queue = this.queues[host];
      if (!queue.length || this.isThrottled(host)) continue;
      const { url, depth } = queue.shift();
      used++;
      this.nextAllowedTick[host] = this.tick + politenessDelay;
      const checksum = this.web.contentOf(url);
      if (this.seenContent.has(checksum)) {
        this.counts.duplicateContent++;
        events.push({ type: "duplicate-content", url });
        continue;
      }
      this.seenContent.add(checksum);
      this.counts.fetched++;
      for (const link of this.web.linksOf(url)) {
        if (this.enqueue(link, depth + 1, maxDepth) === "too-deep")
          events.push({ type: "too-deep", url: link, depth: depth + 1 });
      }
    }
    return events;
  }
}
