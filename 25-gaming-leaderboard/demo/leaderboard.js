// The leaderboard API on top of the skip list: add points, get a rank, get the players around someone.
import { SkipList } from "./skip_list.js";

export class Leaderboard {
  constructor(random) {
    this.list = new SkipList(random);
  }
  score(name) {
    const node = this.list.byName.get(name);
    return node ? node.score : 0;
  }
  // a score change is delete + insert, because the node's position changes
  addPoints(name, points) {
    const total = this.score(name) + points;
    this.list.delete(name);
    this.list.insert(name, total);
    return total;
  }
  rank(name) {
    return this.list.rank(name);
  }
  // `around` players above and below, as [{ rank, name, score }]
  neighbours(name, around = 2) {
    const { rank } = this.list.rank(name);
    const all = this.list.toArray();
    const from = Math.max(0, rank - 1 - around);
    return all
      .slice(from, rank + around)
      .map((n, i) => ({ rank: from + i + 1, name: n.name, score: n.score }));
  }
}
