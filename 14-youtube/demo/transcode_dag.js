// The transcoding pipeline as a DAG of tasks, and a scheduler that runs ready tasks on a limited worker pool.
export const TASKS = [
  { id: "split", deps: [], cost: 3 },
  { id: "inspect", deps: ["split"], cost: 2 },
  { id: "audio", deps: ["split"], cost: 4 },
  { id: "thumbs", deps: ["split"], cost: 3 },
  { id: "240p", deps: ["inspect"], cost: 4 },
  { id: "480p", deps: ["inspect"], cost: 6 },
  { id: "720p", deps: ["inspect"], cost: 9 },
  { id: "1080p", deps: ["inspect"], cost: 14 },
  { id: "package", deps: ["audio", "240p", "480p", "720p", "1080p"], cost: 3 },
  { id: "cdn push", deps: ["package", "thumbs"], cost: 2 },
];
const byId = Object.fromEntries(TASKS.map((t) => [t.id, t]));

// how many dependency hops from the start (used to draw columns)
export function depth(id) {
  const deps = byId[id].deps;
  return deps.length ? 1 + Math.max(...deps.map(depth)) : 0;
}
// the longest chain of costs ending at `id`: no number of workers can finish faster than this
export function criticalPath(id) {
  return byId[id].cost + Math.max(0, ...byId[id].deps.map(criticalPath));
}

export class DagRun {
  constructor() {
    this.state = Object.fromEntries(TASKS.map((t) => [t.id, { status: "waiting", left: t.cost }]));
    this.ticks = 0;
  }
  count(status) {
    return TASKS.filter((t) => this.state[t.id].status === status).length;
  }
  finished() {
    return this.count("done") === TASKS.length;
  }
  // one tick: start ready tasks while workers are free, then make progress on running tasks
  step(workers) {
    if (this.finished()) return;
    this.ticks++;
    let busy = this.count("running");
    for (const t of TASKS) {
      const ready =
        this.state[t.id].status === "waiting" && t.deps.every((d) => this.state[d].status === "done");
      if (ready && busy < workers) {
        this.state[t.id].status = "running";
        busy++;
      }
    }
    for (const t of TASKS) {
      const s = this.state[t.id];
      if (s.status === "running" && --s.left <= 0) s.status = "done";
    }
  }
}
