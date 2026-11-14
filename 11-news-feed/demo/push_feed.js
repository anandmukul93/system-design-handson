// Variant 1, fan-out on write (push): a post is copied into every follower's feed cache. Reads are one fetch.
const FEED_LIMIT = 50;

export class PushFeed {
  constructor(graph) {
    this.graph = graph;
    this.feeds = Array.from({ length: graph.userCount }, () => []);
  }
  // contract: post(user) -> number of writes      read(user) -> number of fetches
  post(user) {
    const item = { user, at: Date.now() };
    let writes = 1; // the post itself
    for (const follower of this.graph.followers[user]) {
      const feed = this.feeds[follower];
      feed.unshift(item);
      if (feed.length > FEED_LIMIT) feed.length = FEED_LIMIT;
      writes++;
    }
    return writes;
  }
  read() {
    return 1; // the precomputed feed
  }
  isPushed() {
    return true;
  }
}
