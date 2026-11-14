// A recursive DNS resolver with a TTL cache. resolve() returns the steps it took, so a UI can show them.
export class DnsResolver {
  constructor(hashFn) {
    this.hash = hashFn; // only used to invent a stable fake IP per name
    this.cache = new Map(); // name -> { ip, expiresAt }
  }
  // now and ttl in seconds. returns { ip, cached, expiresIn?, latencyMs, steps: [{ server, answer, ms }] }
  resolve(name, now, ttl) {
    name = name.trim().replace(/\.$/, "");
    const hit = this.cache.get(name);
    if (hit && hit.expiresAt > now) {
      return { ip: hit.ip, cached: true, expiresIn: hit.expiresAt - now, latencyMs: 1, steps: [] };
    }
    const labels = name.split(".");
    const steps = [
      { server: "root .", answer: "referral to TLD", ms: 20 },
      { server: `.${labels[labels.length - 1]} TLD`, answer: "referral to authoritative NS", ms: 25 },
      { server: `${labels.slice(-2).join(".")} authoritative`, answer: "A record", ms: 30 },
    ];
    const ip = `203.0.113.${this.hash(name) % 250}`;
    this.cache.set(name, { ip, expiresAt: now + ttl });
    return { ip, cached: false, latencyMs: 2 + steps.reduce((a, s) => a + s.ms, 0), steps };
  }
}
