// Rolling, blue-green and canary deploys with automatic rollback; plus a percentage feature flag. Edit me and press Run.
K.title("Deployments and releases", "Deploy v2 (healthy or buggy) to 10 instances. Watch versions, traffic split, errors and the rollback.");

const N = 10;
let fleet = Array.from({ length: N }, () => "v1"), green = null, weightV2 = 0, phase = "idle", step = 0, errs = [];
K.section("Deploy");
const strategy = K.select("Strategy", ["rolling (2 at a time)", "blue-green", "canary (10% → 50% → 100%)"], "canary (10% → 50% → 100%)");
const buggy = K.toggle("v2 is buggy (20% errors)", true);
K.button("Deploy v2", () => { if (phase === "idle" || phase === "done" || phase === "rolled back") { reset(); phase = "deploying"; log.add(`deploying v2 with ${strategy.value}`, "muted"); } }, "primary");
K.button("Reset to v1", () => { reset(); phase = "idle"; });
const st = K.stats({ phase: "Phase", v2: "Traffic on v2", err: "Error rate (1 min)", inst: "v2 instances" });
const cv = K.canvas(70, () => draw());
const chart = K.chart([{ name: "error %" }, { name: "v2 traffic %" }], { height: 140, max: 100 });
const log = K.log(90);
function reset() { fleet = Array(N).fill("v1"); green = null; weightV2 = 0; step = 0; errs = []; chart.reset(); }
function tick() {
  step++;
  const s = strategy.value;
  if (phase === "deploying" && step % 6 === 0) {
    if (s.startsWith("rolling")) { const i = fleet.indexOf("v1"); if (i >= 0) { fleet[i] = "v2"; if (fleet[i + 1] === "v1") fleet[i + 1] = "v2"; } }
    else if (s.startsWith("blue")) { if (!green) { green = Array(N).fill("v2"); log.add("green fleet (v2) up and warmed; switching the router", "muted"); } else weightV2 = 100; }
    else { weightV2 = weightV2 === 0 ? 10 : weightV2 === 10 ? 50 : 100; log.add(`canary at ${weightV2}%`, "muted"); }
  }
  if (s.startsWith("rolling")) weightV2 = (100 * fleet.filter((v) => v === "v2").length) / N;
  // traffic
  let e = 0; const reqs = 200;
  for (let i = 0; i < reqs; i++) { const v2 = Math.random() * 100 < weightV2; if (Math.random() < (v2 && buggy.value ? 0.2 : 0.005)) e++; }
  errs.push((100 * e) / reqs); if (errs.length > 6) errs.shift();
  const rate = errs.reduce((a, b) => a + b, 0) / errs.length;
  if (phase === "deploying" && rate > 2 && weightV2 > 0) {                                 // automated analysis
    phase = "rolled back"; log.add(`error rate ${rate.toFixed(1)}% > 2% SLO guard → automatic rollback`, "bad");
    fleet = Array(N).fill("v1"); green = null; weightV2 = 0;
  }
  if (phase === "deploying" && weightV2 >= 100 && (s.startsWith("rolling") ? !fleet.includes("v1") : true) && step % 6 === 5) { phase = "done"; if (!s.startsWith("rolling")) fleet = Array(N).fill("v2"); green = null; log.add("v2 fully released", "ok"); }
  chart.push(rate, weightV2);
  st.setAll({ phase, v2: weightV2.toFixed(0) + "%", inst: (green ? N : 0) + fleet.filter((v) => v === "v2").length });
  st.set("err", rate.toFixed(1) + "%", rate > 2 ? "bad" : "ok");
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear(); ctx.font = "11px system-ui";
  const w = (width - 20) / (N * (green ? 2 : 1));
  const all = green ? [...fleet, ...green] : fleet;
  all.forEach((v, i) => { ctx.fillStyle = K.color(v === "v2" ? (buggy.value ? "c2" : "c3") : "c1"); ctx.fillRect(10 + i * w, 10, w - 4, 30); ctx.fillStyle = "#fff"; ctx.fillText(v, 14 + i * w, 30); });
  ctx.fillStyle = K.color("muted"); ctx.fillText(green ? "blue (v1) | green (v2): router decides" : "instances", 10, 58);
}
K.loop(tick, 400);

K.section("Feature flag: percentage rollout");
const pct = K.slider("new-checkout rollout %", 0, 100, 25, 1, () => flags());
const fl = K.code("");
function flags() {
  const users = ["ana", "ben", "chen", "dev", "eve", "fay", "gus", "hal", "ivy", "jo"];
  // stable bucketing: the same user stays in or out as the % grows
  fl.set(users.map((u) => { const b = K.hash("new-checkout:" + u) % 100; return `${u.padEnd(5)} bucket ${String(b).padStart(2)} → ${b < pct.value ? "ON" : "off"}`; }).join("\n"));
}
flags();
