// Presence by heartbeat: a user is online while heartbeats keep arriving within the timeout.
export class Presence {
  constructor(users, timeoutTicks = 5) {
    this.timeout = timeoutTicks;
    this.lastBeat = Object.fromEntries(users.map((u) => [u, 0]));
    this.tick = 0;
  }
  isOnline(user) {
    return this.tick - this.lastBeat[user] <= this.timeout;
  }
  // advance one tick; `beating` lists users whose client sent a heartbeat. Returns users that just went offline.
  step(beating) {
    const wasOnline = Object.keys(this.lastBeat).filter((u) => this.isOnline(u));
    this.tick++;
    for (const user of beating) this.lastBeat[user] = this.tick;
    return wasOnline.filter((u) => !this.isOnline(u));
  }
}
