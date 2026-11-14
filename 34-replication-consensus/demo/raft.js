// Raft leader election, simulated in ticks. Followers wait a random timeout for a heartbeat; if none comes
// they become candidates and ask for votes. A candidate with a majority becomes leader for that term.
const HEARTBEAT_EVERY = 5; // ticks
export const MESSAGE_DELAY = 4; // ticks a message spends on the wire

export class RaftCluster {
  constructor(size, random) {
    this.random = random;
    this.nodes = Array.from({ length: size }, (_, id) => ({
      id,
      term: 0,
      role: "follower",
      votedFor: null,
      timer: 0,
      up: true,
      votes: 0,
      logLength: 0,
    }));
    this.nodes.forEach((n) => this.resetElectionTimer(n));
    this.messages = []; // in flight: { from, to, type, term, age, logLength? }
    this.minoritySide = null; // Set of node ids cut off by a partition, or null
  }
  get majority() {
    return Math.floor(this.nodes.length / 2) + 1;
  }
  get leader() {
    return this.nodes.find((n) => n.role === "leader" && n.up);
  }
  // randomized so that two followers rarely time out together and split the vote
  resetElectionTimer(node) {
    node.timer = 15 + Math.floor(this.random() * 15);
  }
  canTalk(a, b) {
    const sameSide = !this.minoritySide || this.minoritySide.has(a.id) === this.minoritySide.has(b.id);
    return a.up && b.up && sameSide;
  }
  send(from, to, type, extra = {}) {
    if (this.canTalk(from, to))
      this.messages.push({ from: from.id, to: to.id, type, term: from.term, age: 0, ...extra });
  }
  broadcast(from, type, extra) {
    for (const other of this.nodes) if (other !== from) this.send(from, other, type, extra);
  }

  // advance one tick; returns [{ text, kind }] describing what happened
  tick() {
    const events = [];
    for (const n of this.nodes) {
      if (!n.up) continue;
      n.timer--;
      if (n.timer > 0) continue;
      if (n.role === "leader") {
        this.broadcast(n, "heartbeat");
        n.timer = HEARTBEAT_EVERY;
      } else {
        n.term++;
        n.role = "candidate";
        n.votedFor = n.id;
        n.votes = 1;
        this.resetElectionTimer(n);
        this.broadcast(n, "request-vote", { logLength: n.logLength });
        events.push({ text: `n${n.id} timed out → candidate for term ${n.term}`, kind: "warn" });
      }
    }
    for (const m of this.messages) m.age++;
    const arrived = this.messages.filter((m) => m.age >= MESSAGE_DELAY);
    this.messages = this.messages.filter((m) => m.age < MESSAGE_DELAY);
    for (const m of arrived) this.deliver(m, events);
    return events;
  }
  deliver(m, events) {
    const to = this.nodes[m.to];
    const from = this.nodes[m.from];
    if (!to.up) return;
    if (m.term > to.term) {
      // anyone who sees a newer term steps down
      to.term = m.term;
      to.role = "follower";
      to.votedFor = null;
    }
    if (m.type === "heartbeat" && m.term >= to.term) {
      to.role = "follower";
      this.resetElectionTimer(to);
    }
    if (m.type === "request-vote") {
      const notVotedYet = to.votedFor === null || to.votedFor === m.from;
      const candidateIsUpToDate = m.logLength >= to.logLength;
      if (m.term >= to.term && notVotedYet && candidateIsUpToDate) {
        to.votedFor = m.from;
        this.resetElectionTimer(to);
        this.send(to, from, "vote");
      }
    }
    if (m.type === "vote" && to.role === "candidate" && m.term === to.term) {
      to.votes++;
      if (to.votes >= this.majority) {
        to.role = "leader";
        to.timer = 0; // send heartbeats right away
        events.push({ text: `n${to.id} wins term ${to.term} with ${to.votes} votes`, kind: "ok" });
      }
    }
  }

  // a client write commits only if the leader can reach a majority. returns { ok, text }
  clientWrite() {
    const leader = this.leader;
    if (!leader) return { ok: false, text: "no leader: write rejected" };
    const reachable = this.nodes.filter((n) => this.canTalk(leader, n));
    if (reachable.length < this.majority)
      return {
        ok: false,
        text: `n${leader.id} only reaches ${reachable.length}/${this.nodes.length}: cannot commit`,
      };
    reachable.forEach((n) => n.logLength++);
    return {
      ok: true,
      text: `n${leader.id} committed entry: ${reachable.length}/${this.nodes.length} replicas (majority)`,
    };
  }
  killLeader() {
    const leader = this.leader;
    if (leader) leader.up = false;
    return leader;
  }
  restartAll() {
    for (const n of this.nodes) {
      if (n.up) continue;
      n.up = true;
      n.role = "follower";
      this.resetElectionTimer(n);
    }
  }
}
