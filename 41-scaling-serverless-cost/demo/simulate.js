// Replays one day of demand against any capacity model and adds up the bill and the pain.
import { MINUTES_PER_DAY, demandAt } from "./demand.js";

export function simulateDay(model, spikeFactor, random, sampleEvery = 5) {
  const series = { demand: [], capacity: [], latency: [] }; // sampled for the charts
  const latencies = [];
  const totals = { cost: 0, overloadedMinutes: 0, coldStarts: 0, utilisation: 0 };
  for (let m = 0; m < MINUTES_PER_DAY; m++) {
    const demand = demandAt(m, spikeFactor, random);
    const r = model.minute(m, demand);
    totals.cost += r.cost;
    totals.coldStarts += r.coldStarts;
    totals.utilisation += r.utilisation;
    if (r.overloaded) totals.overloadedMinutes++;
    latencies.push(r.latencyMs);
    if (m % sampleEvery === 0) {
      series.demand.push(demand);
      series.capacity.push(r.capacity);
      series.latency.push(r.latencyMs);
    }
  }
  latencies.sort((a, b) => a - b);
  return {
    series,
    cost: totals.cost,
    overloadedMinutes: totals.overloadedMinutes,
    coldStarts: totals.coldStarts,
    averageUtilisation: totals.utilisation / MINUTES_PER_DAY,
    p95LatencyMs: latencies[Math.floor(latencies.length * 0.95)],
  };
}
