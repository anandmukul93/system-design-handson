// Variant 3, hybrid: push for normal users, pull for celebrities (accounts above a follower threshold).
import { PushFeed } from "./push_feed.js";

export class HybridFeed {
  constructor(graph, celebrityThreshold) {
    this.graph = graph;
    this.threshold = celebrityThreshold;
    this.push = new PushFeed(graph);
  }
  isPushed(user) {
    return this.graph.followers[user].size < this.threshold;
  }
  // contract: post(user) -> number of writes      read(user) -> number of fetches
  post(user) {
    return this.isPushed(user) ? this.push.post(user) : 1;
  }
  read(user) {
    let fetches = 1; // the precomputed part of the feed
    for (const followee of this.graph.following[user]) if (!this.isPushed(followee)) fetches++;
    return fetches;
  }
}
