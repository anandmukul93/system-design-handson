// A mini orchestrator: reconcile loop, node failure, liveness and readiness probes. Edit me and press Run.
K.title(
  "Containers and orchestration",
  "Set desired replicas, kill pods, fail a node. The reconciler drives actual state back to desired.",
);

const NODES = ["node-a", "node-b", "node-c"];
const nodeUp = Object.fromEntries(NODES.map((n) => [n, true]));
let pods = [],
  nextId = 1,
  tick = 0,
  served = 0,
  dropped = 0;
K.section("Desired state");
const replicas = K.slider("Replicas", 0, 12, 5, 1);
K.button(
  "Kill a random pod",
  () => {
    const p = pods.filter((x) => x.phase !== "Terminated");
    if (p.length) {
      const v = p[Math.floor(Math.random() * p.length)];
      v.phase = "Terminated";
      log.add(`${v.name} killed`, "bad");
    }
  },
  "danger",
);
for (const n of NODES)
  K.button(`fail ${n}`, (e) => {
    nodeUp[n] = !nodeUp[n];
    e.target.textContent = `${nodeUp[n] ? "fail" : "recover"} ${n}`;
    log.add(`${n} ${nodeUp[n] ? "recovered" : "NotReady"}`, nodeUp[n] ? "ok" : "bad");
  });
K.button("Break liveness of a pod (hangs)", () => {
  const p = pods.find((x) => x.phase === "Running" && x.live);
  if (p) {
    p.live = false;
    log.add(`${p.name} deadlocked: liveness probe will fail`, "warn");
  }
});
K.button("Break readiness of a pod (warming cache)", () => {
  const p = pods.find((x) => x.phase === "Running" && x.ready);
  if (p) {
    p.ready = false;
    p.readyAt = tick + 20;
    log.add(`${p.name} not ready: removed from Service endpoints`, "warn");
  }
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

function schedule() {
  const up = NODES.filter((n) => nodeUp[n]);
  if (!up.length) return null;
  return up.reduce((a, b) =>
    pods.filter((p) => p.node === a && p.phase !== "Terminated").length <=
    pods.filter((p) => p.node === b && p.phase !== "Terminated").length
      ? a
      : b,
  );
}
function reconcile() {
  tick++;
  for (const p of pods) {
    if (!nodeUp[p.node] && p.phase !== "Terminated") {
      p.phase = "Terminated";
      log.add(`${p.name} lost with ${p.node}`, "bad");
    }
    if (p.phase === "Pending" && --p.wait <= 0) {
      p.phase = "Running";
      p.live = true;
      p.ready = false;
      p.readyAt = tick + 3;
    }
    if (p.phase === "Running" && !p.ready && p.live && tick >= p.readyAt) p.ready = true;
    if (p.phase === "Running" && !p.live && tick % 3 === 0) {
      // liveness failed 3 times → restart in place with backoff
      p.restarts++;
      p.phase = "Pending";
      p.ready = false;
      p.wait = Math.min(32, 2 ** p.restarts);
      log.add(`${p.name} liveness failed → restart #${p.restarts}, back-off ${p.wait} ticks`, "warn");
    }
  }
  pods = pods.filter((p) => p.phase !== "Terminated" || tick - (p.diedAt ??= tick) < 4);
  const alive = pods.filter((p) => p.phase !== "Terminated");
  if (alive.length < replicas.value) {
    // observe → diff → act
    for (let i = alive.length; i < replicas.value; i++) {
      const node = schedule();
      if (!node) break;
      const p = { name: "web-" + nextId++, node, phase: "Pending", wait: 3, restarts: 0 };
      pods.push(p);
      log.add(`desired ${replicas.value}, have ${alive.length}: create ${p.name} on ${node}`, "ok");
    }
  } else if (alive.length > replicas.value) {
    alive.slice(replicas.value).forEach((p) => {
      p.phase = "Terminated";
      log.add(`scale down: delete ${p.name}`, "muted");
    });
  }
  const eps = pods.filter((p) => p.phase === "Running" && p.ready);
  if (eps.length) served += 10;
  else dropped += 10;
  st.setAll({
    desired: replicas.value,
    running: pods.filter((p) => p.phase === "Running").length,
    restarts: pods.reduce((a, p) => a + (p.restarts || 0), 0),
    traffic: `${served} / ${dropped}`,
  });
  st.set("ready", eps.length, eps.length ? "ok" : "bad");
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  const w = (width - 20) / NODES.length;
  NODES.forEach((n, i) => {
    const x = 10 + i * w;
    ctx.strokeStyle = K.color(nodeUp[n] ? "line" : "bad");
    ctx.lineWidth = 2;
    ctx.strokeRect(x, 18, w - 12, 145);
    ctx.fillStyle = K.color(nodeUp[n] ? "fg" : "bad");
    ctx.fillText(n + (nodeUp[n] ? "" : " (NotReady)"), x + 4, 13);
    pods
      .filter((p) => p.node === n)
      .forEach((p, j) => {
        const y = 26 + j * 22;
        ctx.fillStyle = K.color(
          p.phase === "Terminated"
            ? "line"
            : p.phase === "Pending"
              ? "warn"
              : !p.live
                ? "bad"
                : p.ready
                  ? "ok"
                  : "c5",
        );
        ctx.fillRect(x + 6, y, w - 24, 18);
        ctx.fillStyle = "#fff";
        ctx.fillText(
          `${p.name} ${p.phase === "Running" ? (p.ready ? "ready" : p.live ? "not ready" : "hung") : p.phase}`,
          x + 10,
          y + 13,
        );
      });
  });
}
K.loop(reconcile, 500);
