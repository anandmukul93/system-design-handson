// A consumer group: partitions are divided among members, each tracks a read position and a committed offset.
export class ConsumerGroup {
  constructor(cluster, members) {
    this.cluster = cluster;
    this.members = [...members];
    this.assignment = {}; // partition index -> member
    this.read = cluster.partitions.map(() => 0); // next offset to read
    this.committed = cluster.partitions.map(() => 0); // last offset saved to the broker
    this.consumed = 0;
    this.redelivered = 0;
    this.rebalance();
  }

  // reassign partitions. Anything read but not committed is read again by the new owner (at-least-once).
  rebalance() {
    this.cluster.partitions.forEach((_, i) => {
      this.assignment[i] = this.members[i % this.members.length];
      this.redelivered += this.read[i] - this.committed[i];
      this.read[i] = this.committed[i];
    });
    return { ...this.assignment };
  }
  join(member) {
    this.members.push(member);
    return this.rebalance();
  }
  leave() {
    if (this.members.length <= 1) return null;
    const member = this.members.pop();
    return { member, assignment: this.rebalance() };
  }

  // each member reads up to `batch` messages from each of its partitions; `shouldCommit()` decides when to commit
  poll(batch, shouldCommit) {
    this.cluster.partitions.forEach((p, i) => {
      if (!p.leader) return;
      const n = Math.min(batch, p.log.length - this.read[i]);
      this.read[i] += n;
      this.consumed += n;
      if (shouldCommit()) this.committed[i] = this.read[i];
    });
  }
  lag() {
    return this.cluster.partitions.reduce((sum, p, i) => sum + p.log.length - this.committed[i], 0);
  }
}
