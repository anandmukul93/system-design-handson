// Snowflake generator: 64-bit id = 41-bit timestamp | 5-bit datacenter | 5-bit machine | 12-bit sequence.
// The clock is injected ({ now() -> ms, advance(ms) }) so the demo and tests can control time.
export const EPOCH = 1288834974657n; // Twitter's custom epoch, in ms
export const LAYOUT = [
  ["sign", 1],
  ["timestamp", 41],
  ["datacenter", 5],
  ["machine", 5],
  ["sequence", 12],
];
const MAX_SEQUENCE = 4095n;

export class Snowflake {
  constructor(datacenter, machine, clock) {
    this.datacenter = BigInt(datacenter);
    this.machine = BigInt(machine);
    this.clock = clock;
    this.skewMs = 0; // lets the demo move this machine's clock backwards
    this.lastTimestamp = -1n;
    this.sequence = 0n;
    this.waits = 0;
  }
  timestamp() {
    return BigInt(Math.floor(this.clock.now() + this.skewMs));
  }
  next() {
    let t = this.timestamp();
    if (t < this.lastTimestamp) throw new Error(`clock moved backwards by ${this.lastTimestamp - t} ms`);
    if (t === this.lastTimestamp) {
      this.sequence = (this.sequence + 1n) & MAX_SEQUENCE;
      if (this.sequence === 0n) {
        // 4096 ids already issued in this millisecond: wait for the next one
        while (t <= this.lastTimestamp) {
          this.clock.advance(0.05);
          t = this.timestamp();
          this.waits++;
        }
      }
    } else {
      this.sequence = 0n;
    }
    this.lastTimestamp = t;
    return ((t - EPOCH) << 22n) | (this.datacenter << 17n) | (this.machine << 12n) | this.sequence;
  }
}

// split an id back into its fields
export function decode(id) {
  return {
    timestamp: (id >> 22n) + EPOCH,
    datacenter: (id >> 17n) & 31n,
    machine: (id >> 12n) & 31n,
    sequence: id & 4095n,
  };
}
