// The control loop at the heart of an orchestrator: observe actual state, diff against desired, act.
// It never remembers what it did last time, so it heals any drift, whatever caused it.
import { pickNode } from "./scheduler.js";

export function reconcileReplicas(cluster, desiredReplicas) {
  const events = [];
  const alive = cluster.alivePods();
  for (let have = alive.length; have < desiredReplicas; have++) {
    const node = pickNode(cluster);
    if (!node) break; // nowhere to run: try again next loop
    const pod = cluster.createPod(node);
    events.push({
      text: `desired ${desiredReplicas}, have ${have}: create ${pod.name} on ${node}`,
      kind: "ok",
    });
  }
  for (const pod of alive.slice(desiredReplicas)) {
    cluster.terminate(pod);
    events.push({ text: `scale down: delete ${pod.name}`, kind: "muted" });
  }
  return events;
}
