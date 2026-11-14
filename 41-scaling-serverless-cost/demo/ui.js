// UI only: builds the chosen capacity model from the sliders and charts the simulated day.
import { fixedServers } from "./fixed_servers.js";
import { autoscaling } from "./autoscaling.js";
import { serverless } from "./serverless.js";
import { simulateDay } from "./simulate.js";

K.title(
  "Scaling, serverless and cost",
  "Replay a day with a lunchtime spike. Compare capacity, latency, cold starts and the bill.",
);

K.section("Strategy");
const MODELS = {
  "fixed servers": () => fixedServers({ servers: fixedCount.value }),
  "autoscaling (target tracking)": () =>
    autoscaling({ targetCpuPercent: target.value, cooldownMinutes: cooldown.value, bootMinutes: boot.value }),
  serverless: () => serverless({ idleTimeoutMinutes: idle.value }),
};
const mode = K.select("Capacity model", Object.keys(MODELS), "autoscaling (target tracking)", () => run());
const fixedCount = K.slider("Fixed: servers", 1, 40, 10, 1, () => run());
const target = K.slider("Autoscale: target CPU %", 30, 90, 60, 5, () => run());
const cooldown = K.slider("Autoscale: cooldown (min)", 1, 30, 5, 1, () => run());
const boot = K.slider("Autoscale: instance boot time (min)", 1, 10, 3, 1, () => run());
const idle = K.slider("Serverless: idle timeout (min)", 1, 30, 10, 1, () => run());
const spike = K.slider("Spike height (x normal)", 1, 10, 4, 0.5, () => run());
const st = K.stats({
  cost: "Cost for the day",
  p95: "p95 latency",
  over: "Minutes overloaded",
  cold: "Cold starts",
  util: "Avg utilisation",
});
const SAMPLE_EVERY = 5; // minutes per chart point
const chart = K.chart([{ name: "demand (rps)" }, { name: "capacity (rps)" }], {
  height: 170,
  points: 1440 / SAMPLE_EVERY,
});
const latencyChart = K.chart([{ name: "latency ms" }], { height: 110, points: 1440 / SAMPLE_EVERY });

function run() {
  const day = simulateDay(MODELS[mode.value](), spike.value, K.rng(41), SAMPLE_EVERY);
  chart.set([day.series.demand, day.series.capacity]);
  latencyChart.set([day.series.latency]);
  st.setAll({
    cost: "$" + day.cost.toFixed(2),
    p95: day.p95LatencyMs.toFixed(0) + " ms",
    cold: day.coldStarts,
    util: (100 * day.averageUtilisation).toFixed(0) + "%",
  });
  st.set("over", day.overloadedMinutes, day.overloadedMinutes ? "bad" : "ok");
}
run();
