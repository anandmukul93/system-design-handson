// UI only: starts a rollout with the chosen strategy, feeds it observed errors, and draws the fleet.
import { rolling } from "./rolling.js";
import { blueGreen } from "./blue_green.js";
import { canary } from "./canary.js";
import { Rollout } from "./rollout.js";
import { observeErrorPercent } from "./traffic.js";
import { bucketOf, isEnabled } from "./feature_flag.js";

K.title(
  "Deployments and releases",
  "Deploy v2 (healthy or buggy) to 10 instances. Watch versions, traffic split, errors and the rollback.",
);

const STRATEGIES = [rolling, blueGreen, canary];
const rollout = new Rollout(10);

K.section("Deploy");
const strategy = K.select(
  "Strategy",
  STRATEGIES.map((s) => s.name),
  canary.name,
);
const buggy = K.toggle("v2 is buggy (20% errors)", true);
K.button(
  "Deploy v2",
  () => {
    if (rollout.phase === "deploying") return;
    rollout.start(STRATEGIES.find((s) => s.name === strategy.value));
    chart.reset();
    log.add(`deploying v2 with ${strategy.value}`, "muted");
  },
  "primary",
);
K.button("Reset to v1", () => {
  rollout.reset();
  chart.reset();
});
const st = K.stats({ phase: "Phase", v2: "Traffic on v2", err: "Error rate (1 min)", inst: "v2 instances" });
const cv = K.canvas(70, () => draw());
const chart = K.chart([{ name: "error %" }, { name: "v2 traffic %" }], { height: 140, max: 100 });
const log = K.log(90);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  const { instances, green } = rollout.state;
  const all = green ? [...instances, ...green] : instances;
  const w = (width - 20) / all.length;
  all.forEach((version, i) => {
    ctx.fillStyle = K.color(version === "v1" ? "c1" : buggy.value ? "c2" : "c3");
    ctx.fillRect(10 + i * w, 10, w - 4, 30);
    ctx.fillStyle = "#fff";
    ctx.fillText(version, 14 + i * w, 30);
  });
  ctx.fillStyle = K.color("muted");
  ctx.fillText(green ? "blue (v1) | green (v2): router decides" : "instances", 10, 58);
}
K.loop(() => {
  const observed = observeErrorPercent(rollout.state.v2TrafficPercent, buggy.value, Math.random);
  for (const e of rollout.tick(observed)) log.add(e.text, e.kind);
  chart.push(rollout.errorRate, rollout.state.v2TrafficPercent);
  st.setAll({
    phase: rollout.phase,
    v2: rollout.state.v2TrafficPercent.toFixed(0) + "%",
    inst: rollout.v2Instances,
  });
  st.set("err", rollout.errorRate.toFixed(1) + "%", rollout.errorRate > 2 ? "bad" : "ok");
  draw();
}, 400);

K.section("Feature flag: percentage rollout");
const FLAG = "new-checkout";
const USERS = ["ana", "ben", "chen", "dev", "eve", "fay", "gus", "hal", "ivy", "jo"];
const percent = K.slider(`${FLAG} rollout %`, 0, 100, 25, 1, () => showFlags());
const flagOut = K.code("");
function showFlags() {
  const line = (user) => {
    const bucket = String(bucketOf(FLAG, user, K.hash)).padStart(2);
    return `${user.padEnd(5)} bucket ${bucket} → ${isEnabled(FLAG, user, percent.value, K.hash) ? "ON" : "off"}`;
  };
  flagOut.set(USERS.map(line).join("\n"));
}
showFlags();
