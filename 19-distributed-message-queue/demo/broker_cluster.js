// Brokers and partitions: each partition is an append-only log with a leader and an in-sync replica set (ISR).
export class BrokerCluster {
  constructor(brokers, partitionCount) {
    this.brokers = brokers;
    this.up = Object.fromEntries(brokers.map((b) => [b, true]));
    this.partitions = Array.from({ length: partitionCount }, (_, i) => {
      const replicas = brokers.map((_, k) => brokers[(i + k) % brokers.length]);
      return { log: [], replicas, leader: replicas[0], isr: [...replicas] };
    });
    this.produced = 0;
  }

  // returns false when the partition has no leader (the producer gets an error and must retry)
  append(partitionIndex, message) {
    const p = this.partitions[partitionIndex];
    if (!p.leader) return false;
    p.log.push(message);
    this.produced++;
    return true;
  }

  // flip a broker up/down, then repair leadership. Returns events for the UI.
  setBroker(broker, isUp) {
    this.up[broker] = isUp;
    const events = [];
    this.partitions.forEach((p, i) => {
      p.isr = p.replicas.filter((r) => this.up[r]);
      const leaderDied = p.leader && !this.up[p.leader];
      if (leaderDied) {
        const old = p.leader;
        p.leader = p.isr[0] || null; // only an in-sync replica may take over, or committed data could be lost
        events.push(
          p.leader
            ? { type: "failover", partition: i, from: old, to: p.leader }
            : { type: "offline", partition: i },
        );
      } else if (!p.leader && p.isr.length) {
        p.leader = p.isr[0];
        events.push({ type: "online", partition: i, to: p.leader });
      }
    });
    return events;
  }
}
