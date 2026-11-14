// A trie where every node caches the top-k queries below it, so a lookup is O(prefix length).
export class Trie {
  constructor(topK = 3) {
    this.topK = topK;
    this.frequency = new Map(); // query -> how often it was searched
    this.root = this.node();
  }
  node() {
    return { children: {}, top: [], query: null };
  }

  // record `count` more searches of a query, then rebuild the cached top-k lists
  add(query, count = 1) {
    this.frequency.set(query, (this.frequency.get(query) || 0) + count);
    this.rebuild();
  }

  rebuild() {
    this.root = this.node();
    for (const query of this.frequency.keys()) {
      let n = this.root;
      for (const ch of query) n = n.children[ch] ??= this.node();
      n.query = query;
    }
    this.fillTop(this.root);
  }

  // post-order: a node's top-k is the best of its own query and its children's top-k lists
  fillTop(n) {
    const candidates = n.query ? [n.query] : [];
    for (const child of Object.values(n.children)) candidates.push(...this.fillTop(child));
    n.top = [...new Set(candidates)]
      .sort((a, b) => this.frequency.get(b) - this.frequency.get(a))
      .slice(0, this.topK);
    return n.top;
  }

  // walk down the prefix; null if no query starts with it
  find(prefix) {
    let n = this.root;
    for (const ch of prefix) {
      n = n.children[ch];
      if (!n) return null;
    }
    return n;
  }

  suggest(prefix) {
    const n = this.find(prefix);
    return n ? n.top.map((query) => ({ query, frequency: this.frequency.get(query) })) : [];
  }
}
