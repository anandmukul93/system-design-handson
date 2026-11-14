// UI only: buttons that break things, and a drawing of nodes and pods. Each tick runs kubelets, then the controller.
import { Cluster } from "./cluster.js";
import { runKubelets } from "./kubelet.js";
import { reconcileReplicas } from "./replica_controller.js";

K.title(
  "Containers and orchestration",
  "Set desired replicas, kill pods, fail a node. The reconciler drives actual state back to desired.",
);

const cluster = new Cluster(["node-a", "node-b", "node-c"]);
let served = 0;
let dropped = 0;

K.section("Desired state");
const replicas = K.slider("Replicas", 0, 12, 5, 1);
K.button(
  "Kill a random pod",
  () => {
    const alive = cluster.alivePods();
    if (!alive.length) return;
    const victim = alive[Math.floor(Math.random() * alive.length)];
    cluster.terminate(victim);
    log.add(`${victim.name} killed`, "bad");
  },
  "danger",
);
for (const node of cluster.nodes) {
  K.button(`fail ${node.name}`, (e) => {
    node.ready = !node.ready;
    e.target.textContent = `${node.ready ? "fail" : "recover"} ${node.name}`;
    log.add(`${node.name} ${node.ready ? "recovered" : "NotReady"}`, node.ready ? "ok" : "bad");
  });
}
K.button("Break liveness of a pod (hangs)", () => {
  const pod = cluster.pods.find((p) => p.phase === "Running" && p.live);
  if (!pod) return;
  pod.live = false;
  log.add(`${pod.name} deadlocked: liveness probe will fail`, "warn");
});
K.button("Break readiness of a pod (warming cache)", () => {
  const pod = cluster.endpoints()[0];
  if (!pod) return;
  pod.ready = false;
  pod.readyAt = cluster.tick + 20;
  log.add(`${pod.name} not ready: removed from Service endpoints`, "warn");
});
const st = K.stats({
  desired: "Desired",
  running: "Running",
  ready: "Ready endpoints",
  restarts: "Restarts",
  traffic: "Requests served / dropped",
});
const cv = K.canvas(170, () => draw());
const log = K.log(110);

function podLabel(pod) {
  if (pod.phase !== "Running") return [pod.phase, pod.phase === "Pending" ? "warn" : "line"];
  if (!pod.live) return ["hung", "bad"];
  return pod.ready ? ["ready", "ok"] : ["not ready", "c5"];
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  const columnWidth = (width - 20) / cluster.nodes.length;
  cluster.nodes.forEach((node, i) => {
    const x = 10 + i * columnWidth;
    ctx.strokeStyle = K.color(node.ready ? "line" : "bad");
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 18, columnWidth - 12, 145);
    ctx.fillStyle = K.color(node.ready ? "fg" : "bad");
    ctx.fillText(node.name + (node.ready ? "" : " (NotReady)"), x + 4, 13);
    cluster.pods
      .filter((p) => p.node === node.name)
      .forEach((pod, row) => {
        const [label, color] = podLabel(pod);
        const y = 26 + row * 22;
        ctx.fillStyle = K.color(color);
        ctx.fillRect(x + 6, y, columnWidth - 24, 18);
        ctx.fillStyle = "#fff";
        ctx.fillText(`${pod.name} ${label}`, x + 10, y + 13);
      });
  });
}
K.loop(() => {
  cluster.tick++;
  const events = [...runKubelets(cluster), ...reconcileReplicas(cluster, replicas.value)];
  for (const e of events) log.add(e.text, e.kind);
  cluster.removeOldTerminated();
  const endpoints = cluster.endpoints().length;
  if (endpoints) served += 10;
  else dropped += 10;
  st.setAll({
    desired: replicas.value,
    running: cluster.pods.filter((p) => p.phase === "Running").length,
    restarts: cluster.pods.reduce((sum, p) => sum + p.restarts, 0),
    traffic: `${served} / ${dropped}`,
  });
  st.set("ready", endpoints, endpoints ? "ok" : "bad");
  draw();
}, 500);
