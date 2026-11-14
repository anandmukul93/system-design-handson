// The pipeline: dedupe by event id, one queue per channel, a worker pool, retries and a dead-letter queue.
// Randomness and provider behaviour are passed in, so this file has no UI and is easy to test.
import { backoffDelay } from "./backoff.js";

export const CHANNELS = ["push", "sms", "email"];
const WORKERS_PER_CHANNEL = 5;

export class Pipeline {
  constructor(random) {
    this.random = random;
    this.tick = 0;
    this.seenEvents = new Set(); // idempotency keys
    this.queues = Object.fromEntries(CHANNELS.map((c) => [c, []])); // channel -> [{ id, attempt, readyAt }]
    this.stats = Object.fromEntries(CHANNELS.map((c) => [c, { sent: 0, retried: 0, deadLettered: 0 }]));
    this.received = 0;
    this.deduped = 0;
  }

  // returns false when the event was a duplicate
  submit(eventId) {
    this.received++;
    if (this.seenEvents.has(eventId)) {
      this.deduped++;
      return false;
    }
    this.seenEvents.add(eventId);
    this.queues[CHANNELS[eventId % CHANNELS.length]].push({ id: eventId, attempt: 1, readyAt: this.tick });
    return true;
  }

  // providers: { push: { failPercent, latency }, ... }.  Returns events for the UI to log.
  step(providers, maxAttempts) {
    this.tick++;
    const events = [];
    for (const channel of CHANNELS) {
      const queue = this.queues[channel];
      const ready = queue.filter((m) => m.readyAt <= this.tick).slice(0, WORKERS_PER_CHANNEL);
      for (const message of ready) {
        queue.splice(queue.indexOf(message), 1);
        const failed = this.random() * 100 < providers[channel].failPercent;
        if (!failed) {
          this.stats[channel].sent++;
        } else if (message.attempt >= maxAttempts) {
          this.stats[channel].deadLettered++;
          events.push({ type: "dead-letter", channel, id: message.id, attempts: message.attempt });
        } else {
          const delay = backoffDelay(message.attempt, providers[channel].latency, this.random);
          this.stats[channel].retried++;
          queue.push({ ...message, attempt: message.attempt + 1, readyAt: this.tick + delay });
          if (message.attempt === 1) events.push({ type: "retry", channel, id: message.id, delay });
        }
      }
    }
    return events;
  }

  pending() {
    return CHANNELS.reduce((a, c) => a + this.queues[c].length, 0);
  }
  deadLettered() {
    return CHANNELS.reduce((a, c) => a + this.stats[c].deadLettered, 0);
  }
}
