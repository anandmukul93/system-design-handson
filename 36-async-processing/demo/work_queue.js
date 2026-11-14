// A work queue with visibility timeouts (the SQS model). Receiving a job does not remove it: it only hides it
// for a while. The worker must ack (delete) it. If the worker dies, the job becomes visible again by itself.
export class WorkQueue {
  constructor() {
    this.jobs = []; // { id, poison, receives, invisibleUntil }
    this.deadLetters = [];
    this.nextId = 1;
    this.redelivered = 0;
  }
  send({ poison = false } = {}) {
    this.jobs.push({ id: this.nextId++, poison, receives: 0, invisibleUntil: 0 });
  }
  // returns a job leased until now + visibilityTimeout, or null. Jobs received too often go to the DLQ instead.
  receive(now, { visibilityTimeout, maxReceives }) {
    for (const job of [...this.jobs]) {
      if (job.invisibleUntil > now) continue; // someone holds a lease on it
      if (job.receives >= maxReceives) {
        this.jobs.splice(this.jobs.indexOf(job), 1);
        this.deadLetters.push(job);
        continue;
      }
      job.receives++;
      if (job.receives > 1) this.redelivered++;
      job.invisibleUntil = now + visibilityTimeout;
      return job;
    }
    return null;
  }
  ack(job) {
    const index = this.jobs.indexOf(job);
    if (index >= 0) this.jobs.splice(index, 1);
  }
  visible(now) {
    return this.jobs.filter((j) => j.invisibleUntil <= now);
  }
  inFlight(now) {
    return this.jobs.filter((j) => j.invisibleUntil > now);
  }
}
