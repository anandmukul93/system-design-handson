// One primary database and replicas in other regions. Writes go to the primary and are shipped to the
// replicas after a delay (0 = synchronous). Missed heartbeats trigger a failover.
import { failover } from "./failover.js";

const WRITES_PER_TICK = 5;
const HEARTBEATS_BEFORE_FAILOVER = 3;

export class DatabaseCluster {
  constructor(regionNames) {
    this.regions = regionNames.map((name, i) => ({
      name,
      up: true,
      role: i === 0 ? "primary" : "replica",
      lsn: 0,
    }));
    this.inTransit = []; // { region, lsn, arrivesAt }
    this.tick = 0;
    this.written = 0;
    this.lostWrites = 0;
    this.failedRequests = 0;
    this.missedHeartbeats = 0;
    this.noPrimarySince = null;
  }
  get primary() {
    return this.regions.find((r) => r.role === "primary" && r.up);
  }
  get ticksWithoutPrimary() {
    return this.noPrimarySince === null ? 0 : this.tick - this.noPrimarySince;
  }
  restore(region) {
    region.up = true;
    region.role = "replica"; // a returning region never assumes it is still the primary
  }
  // replicationDelay: (regionName) -> ticks. returns [{ text, kind }]
  step(replicationDelay) {
    this.tick++;
    const events = [];
    const primary = this.primary;
    if (primary) {
      for (let i = 0; i < WRITES_PER_TICK; i++) {
        primary.lsn++;
        this.written++;
        for (const r of this.regions)
          if (r !== primary)
            this.inTransit.push({
              region: r,
              lsn: primary.lsn,
              arrivesAt: this.tick + replicationDelay(r.name),
            });
      }
      this.noPrimarySince = null;
      this.missedHeartbeats = 0;
    } else {
      this.failedRequests += WRITES_PER_TICK;
      this.noPrimarySince ??= this.tick;
      if (++this.missedHeartbeats === HEARTBEATS_BEFORE_FAILOVER) events.push(this.failOver());
    }
    const arrived = this.inTransit.filter((m) => m.arrivesAt <= this.tick);
    this.inTransit = this.inTransit.filter((m) => m.arrivesAt > this.tick);
    for (const m of arrived) if (m.region.up) m.region.lsn = Math.max(m.region.lsn, m.lsn);
    return events;
  }
  failOver() {
    const result = failover(this.regions);
    if (!result) return { text: "no healthy replica to promote", kind: "bad" };
    this.inTransit = []; // the dead primary's unsent log is gone
    this.lostWrites += result.lostWrites;
    const { promoted, lostWrites } = result;
    return {
      text: `failover after ${this.ticksWithoutPrimary} ticks: promoted ${promoted.name} (highest LSN ${promoted.lsn}); ${lostWrites} unreplicated writes lost; DNS / routing updated`,
      kind: lostWrites ? "warn" : "ok",
    };
  }
}
