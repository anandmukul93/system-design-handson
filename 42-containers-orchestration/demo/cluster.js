// Actual state of the cluster: nodes and the pods on them. Everything else only reads or changes this.
// pod: { name, node, phase: "Pending" | "Running" | "Terminated", live, ready, readyAt, wait, restarts }
export class Cluster {
  constructor(nodeNames) {
    this.nodes = nodeNames.map((name) => ({ name, ready: true }));
    this.pods = [];
    this.nextId = 1;
    this.tick = 0;
  }
  node(name) {
    return this.nodes.find((n) => n.name === name);
  }
  alivePods() {
    return this.pods.filter((p) => p.phase !== "Terminated");
  }
  // pods a Service would send traffic to
  endpoints() {
    return this.pods.filter((p) => p.phase === "Running" && p.ready);
  }
  createPod(nodeName) {
    const pod = { name: "web-" + this.nextId++, node: nodeName, phase: "Pending", wait: 3, restarts: 0 };
    this.pods.push(pod);
    return pod;
  }
  terminate(pod) {
    pod.phase = "Terminated";
    pod.diedAt = this.tick;
  }
  // forget terminated pods after a few ticks (they stay visible briefly)
  removeOldTerminated(keepTicks = 4) {
    this.pods = this.pods.filter((p) => p.phase !== "Terminated" || this.tick - p.diedAt < keepTicks);
  }
}
