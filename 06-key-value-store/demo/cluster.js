// Dynamo-style cluster: preference lists, tunable N/W/R quorums, sloppy quorum with hinted handoff.
// No UI here: every operation returns a plain result object that includes an `events` list.
import { descends, merge, increment, siblings } from "./vector_clock.js";

export class Cluster {
  constructor(nodeNames, hashFn) {
    this.nodes = nodeNames;
    this.hash = hashFn;
    this.up = Object.fromEntries(nodeNames.map((n) => [n, true]));
    this.store = Object.fromEntries(nodeNames.map((n) => [n, {}])); // node -> key -> [{ value, clock }]
    this.hints = []; // { holder, intendedFor, key, value, clock }
  }

  // the N nodes responsible for a key, walking clockwise from its hash
  preferenceList(key, n) {
    const start = this.hash(key) % this.nodes.length;
    return Array.from({ length: n }, (_, i) => this.nodes[(start + i) % this.nodes.length]);
  }

  // returns { ok, acks, clock, events }
  put(key, value, { n, w, sloppy, coordinator }) {
    const events = [];
    const pref = this.preferenceList(key, n);
    // read-before-write: the new clock descends from every version the reachable replicas hold
    let context = {};
    for (const node of pref)
      if (this.up[node])
        for (const version of this.store[node][key] || []) context = merge(context, version.clock);
    const clock = increment(context, coordinator);

    const candidates = [...pref];
    if (sloppy) candidates.push(...this.nodes.filter((node) => !pref.includes(node)));
    const downReplicas = pref.filter((node) => !this.up[node]);
    let acks = 0;
    for (const node of candidates) {
      if (acks >= n) break;
      if (!this.up[node]) continue;
      if (pref.includes(node)) {
        this.writeLocal(node, key, value, clock);
      } else {
        const intendedFor = downReplicas.shift();
        if (!intendedFor) break; // every down replica already has a stand-in
        this.hints.push({ holder: node, intendedFor, key, value, clock });
        events.push({ type: "hint", holder: node, intendedFor });
      }
      acks++;
    }
    return { ok: acks >= w, acks, clock, events };
  }

  writeLocal(node, key, value, clock) {
    const kept = (this.store[node][key] || []).filter((v) => !descends(clock, v.clock));
    if (!kept.some((v) => descends(v.clock, clock))) kept.push({ value, clock });
    this.store[node][key] = kept;
  }

  // returns { ok, replies: [node], versions: [{ value, clock }] }; more than one version means a conflict
  get(key, { n, r }) {
    const replies = this.preferenceList(key, n)
      .filter((node) => this.up[node])
      .slice(0, r);
    if (replies.length < r) return { ok: false, replies, versions: [] };
    const all = replies.flatMap((node) => this.store[node][key] || []);
    return { ok: true, replies, versions: siblings(all) };
  }

  // toggles a node; on recovery, nodes holding hints for it hand them off. Returns the handoff events.
  setUp(node, isUp) {
    this.up[node] = isUp;
    const events = [];
    if (!isUp) return events;
    for (let i = this.hints.length - 1; i >= 0; i--) {
      if (this.hints[i].intendedFor !== node) continue;
      const hint = this.hints.splice(i, 1)[0];
      this.writeLocal(node, hint.key, hint.value, hint.clock);
      events.push({ type: "handoff", holder: hint.holder, key: hint.key });
    }
    return events;
  }
}
