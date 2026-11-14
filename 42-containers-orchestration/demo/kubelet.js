// The node agent: starts containers, runs probes, restarts hung containers. Returns [{ text, kind }].
//   liveness probe fails  -> restart the container in place, with exponential back-off
//   readiness probe fails -> keep it running, but take it out of the Service endpoints
const STARTUP_TICKS = 3;
const LIVENESS_PERIOD = 3;
const MAX_BACKOFF = 32;

export function runKubelets(cluster) {
  const events = [];
  for (const pod of cluster.alivePods()) {
    if (!cluster.node(pod.node).ready) {
      cluster.terminate(pod);
      events.push({ text: `${pod.name} lost with ${pod.node}`, kind: "bad" });
    } else if (pod.phase === "Pending") {
      if (--pod.wait > 0) continue;
      pod.phase = "Running";
      pod.live = true;
      pod.ready = false;
      pod.readyAt = cluster.tick + STARTUP_TICKS;
    } else if (!pod.live) {
      if (cluster.tick % LIVENESS_PERIOD !== 0) continue;
      pod.restarts++;
      pod.phase = "Pending";
      pod.ready = false;
      pod.wait = Math.min(MAX_BACKOFF, 2 ** pod.restarts);
      events.push({
        text: `${pod.name} liveness failed → restart #${pod.restarts}, back-off ${pod.wait} ticks`,
        kind: "warn",
      });
    } else if (!pod.ready && cluster.tick >= pod.readyAt) {
      pod.ready = true;
    }
  }
  return events;
}
