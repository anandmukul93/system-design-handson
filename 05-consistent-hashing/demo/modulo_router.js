// Variant 1, hash % N: simple and perfectly even, but changing N remaps almost every key.
import { hash32 } from "./hashing.js";

export class ModuloRouter {
  constructor(servers) {
    this.setServers(servers);
  }
  setServers(servers) {
    this.servers = [...servers];
  }
  owner(key) {
    return this.servers[hash32(key) % this.servers.length];
  }
}
