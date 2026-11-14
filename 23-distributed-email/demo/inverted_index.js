// An inverted index: term -> list of message ids (a "postings list"). Search = intersect the lists.
export function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9#]+/g) || [];
}

export class InvertedIndex {
  constructor() {
    this.postings = new Map(); // term -> [message id]
  }
  add(id, text) {
    for (const term of new Set(tokenize(text))) {
      if (!this.postings.has(term)) this.postings.set(term, []);
      this.postings.get(term).push(id);
    }
  }
  // AND query: ids of messages containing every term. Returns null for an empty query.
  search(query) {
    let hits = null;
    for (const term of tokenize(query)) {
      const list = new Set(this.postings.get(term) || []);
      hits = hits ? new Set([...hits].filter((id) => list.has(id))) : list;
    }
    return hits;
  }
  termCount() {
    return this.postings.size;
  }
  postingCount() {
    return [...this.postings.values()].reduce((a, list) => a + list.length, 0);
  }
}
