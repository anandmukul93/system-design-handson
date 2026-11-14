// Variant 2, fan-out on read (pull): a post is one write. Reading merges the latest posts of everyone you follow.
export class PullFeed {
  constructor(graph) {
    this.graph = graph;
  }
  // contract: post(user) -> number of writes      read(user) -> number of fetches
  post() {
    return 1;
  }
  read(user) {
    return 1 + this.graph.following[user].size; // one fetch per followee
  }
  isPushed() {
    return false;
  }
}
