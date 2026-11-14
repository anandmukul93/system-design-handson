// Workers pull jobs from the queue. They can crash mid-job, and poison jobs always throw.
// Delivery is at-least-once: a slow worker whose lease expired can finish a job another worker also ran.
export class WorkerPool {
  constructor(queue, random) {
    this.queue = queue;
    this.random = random;
    this.workers = []; // { job, secondsLeft }
    this.completed = new Set();
    this.done = 0;
    this.processedTwice = 0;
  }
  resize(count) {
    while (this.workers.length < count) this.workers.push({ job: null, secondsLeft: 0 });
    this.workers.length = count;
  }
  // advance every worker by dt seconds. options: { visibilityTimeout, maxReceives, crashPercentPerSecond }
  // returns [{ text, kind }]
  step(now, dt, options) {
    const events = [];
    for (const worker of this.workers) {
      if (!worker.job) {
        worker.job = this.queue.receive(now, options);
        worker.secondsLeft = 1 + this.random() * 3;
        continue;
      }
      const job = worker.job;
      worker.secondsLeft -= dt;
      if (this.random() * 100 < options.crashPercentPerSecond * dt) {
        events.push({
          text: `worker crashed holding job ${job.id}: it reappears when the lease expires`,
          kind: "bad",
        });
        worker.job = null; // no ack
      } else if (worker.secondsLeft <= 0) {
        worker.job = null;
        if (job.poison) {
          events.push({ text: `job ${job.id} threw (poison), receive ${job.receives}`, kind: "warn" }); // no ack
          continue;
        }
        if (this.completed.has(job.id)) this.processedTwice++;
        this.completed.add(job.id);
        this.done++;
        this.queue.ack(job);
      }
    }
    return events;
  }
}
