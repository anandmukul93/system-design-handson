// A skip list ordered by score (highest first), like a Redis sorted set. Each link remembers how many
// nodes it skips ("span"), which lets rank lookups run in O(log n) instead of walking the whole list.
const MAX_LEVEL = 6;

export class SkipList {
  constructor(random) {
    this.random = random;
    this.maxLevel = MAX_LEVEL;
    this.head = {
      name: "HEAD",
      score: Infinity,
      next: Array(MAX_LEVEL).fill(null),
      span: Array(MAX_LEVEL).fill(0),
    };
    this.byName = new Map();
  }
  // ordering: higher score first, ties broken by name
  comesBefore(node, score, name) {
    return node.score > score || (node.score === score && node.name < name);
  }
  // coin flips: each node reaches level L+1 with probability 1/2
  randomLevel() {
    let level = 1;
    while (level < MAX_LEVEL && this.random() < 0.5) level++;
    return level;
  }

  insert(name, score) {
    const update = []; // rightmost node before the insert position, per level
    const rank = []; // rank of that node, per level
    let x = this.head;
    for (let i = MAX_LEVEL - 1; i >= 0; i--) {
      rank[i] = i === MAX_LEVEL - 1 ? 0 : rank[i + 1];
      while (x.next[i] && this.comesBefore(x.next[i], score, name)) {
        rank[i] += x.span[i];
        x = x.next[i];
      }
      update[i] = x;
    }
    const level = this.randomLevel();
    const node = { name, score, level, next: Array(MAX_LEVEL).fill(null), span: Array(MAX_LEVEL).fill(0) };
    for (let i = 0; i < MAX_LEVEL; i++) {
      if (i < level) {
        node.next[i] = update[i].next[i];
        update[i].next[i] = node;
        node.span[i] = update[i].span[i] - (rank[0] - rank[i]);
        update[i].span[i] = rank[0] - rank[i] + 1;
      } else {
        update[i].span[i]++; // a higher link now jumps over one more node
      }
    }
    this.byName.set(name, node);
    return node;
  }

  delete(name) {
    const node = this.byName.get(name);
    if (!node) return;
    let x = this.head;
    for (let i = MAX_LEVEL - 1; i >= 0; i--) {
      while (x.next[i] && x.next[i] !== node && this.comesBefore(x.next[i], node.score, node.name))
        x = x.next[i];
      if (x.next[i] === node) {
        x.span[i] += node.span[i] - 1;
        x.next[i] = node.next[i];
      } else {
        x.span[i]--;
      }
    }
    this.byName.delete(name);
  }

  // returns { rank (1 = top), path: [[node, level]] } where path is every node the search stepped onto
  rank(name) {
    const target = this.byName.get(name);
    if (!target) return null;
    const path = [];
    let x = this.head;
    let rank = 0;
    for (let i = MAX_LEVEL - 1; i >= 0; i--) {
      while (x.next[i] && (x.next[i] === target || this.comesBefore(x.next[i], target.score, target.name))) {
        rank += x.span[i];
        x = x.next[i];
        path.push([x, i]);
      }
      if (x === target) break;
    }
    return { rank, path };
  }

  // all nodes in order, best first
  toArray() {
    const out = [];
    for (let x = this.head.next[0]; x; x = x.next[0]) out.push(x);
    return out;
  }
}
