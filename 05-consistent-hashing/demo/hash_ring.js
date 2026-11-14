// Variant 2, consistent hash ring with virtual nodes: changing N moves only about 1/N of the keys.
import { ringPosition } from "./hashing.js";

export class HashRing {
  constructor(servers, virtualNodes = 20) {
    this.virtualNodes = virtualNodes;
    this.setServers(servers);
  }
  setServers(servers) {
    this.servers = [...servers];
    this.points = []; // sorted [{ pos, server }]
    for (const server of servers)
      for (let v = 0; v < this.virtualNodes; v++)
        this.points.push({ pos: ringPosition(server + "#" + v), server });
    this.points.sort((a, b) => a.pos - b.pos);
  }
  // first point clockwise from the key's position (binary search), wrapping around at the end
  owner(key) {
    const p = ringPosition(key);
    let lo = 0;
    let hi = this.points.length;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (this.points[mid].pos < p) lo = mid + 1;
      else hi = mid;
    }
    return this.points[lo % this.points.length].server;
  }
}
