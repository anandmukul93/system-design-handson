// Location fan-out: each user has a pub/sub channel; friends subscribe to it. A location update is published
// to the channel and delivered to every subscriber, whose server then filters by distance.
import { distance } from "./world.js";

export class LocationPubSub {
  constructor(users) {
    this.users = users;
  }
  // publish one user's location. Returns { delivered, inRange } message counts.
  publish(user, radius) {
    let delivered = 0;
    let inRange = 0;
    for (const friendId of user.friends) {
      delivered++; // every subscriber gets the message...
      if (distance(this.users[friendId], user) <= radius) inRange++; // ...but only nearby ones show it
    }
    return { delivered, inRange };
  }
  // run one tick: users whose turn it is publish. Returns { publishes, delivered, inRange, publishers }.
  step(tick, intervalTicks, radius) {
    const totals = { publishes: 0, delivered: 0, inRange: 0, publishers: [] };
    for (const user of this.users) {
      if ((tick + user.phase) % intervalTicks !== 0) continue;
      const r = this.publish(user, radius);
      totals.publishes++;
      totals.delivered += r.delivered;
      totals.inRange += r.inRange;
      totals.publishers.push(user.id);
    }
    return totals;
  }
}
