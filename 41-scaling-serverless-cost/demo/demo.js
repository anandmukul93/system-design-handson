// A day of traffic vs fixed servers, target-tracking autoscaling and serverless. Edit me and press Run.
K.title("Scaling, serverless and cost", "Replay a day with a lunchtime spike. Compare capacity, latency, cold starts and the bill.");

K.section("Strategy");
const mode = K.select("Capacity model", ["fixed servers", "autoscaling (target tracking)", "serverless"], "autoscaling (target tracking)", () => run());
const fixedN = K.slider("Fixed: servers", 1, 40, 10, 1, () => run());
const target = K.slider("Autoscale: target CPU %", 30, 90, 60, 5, () => run());
const cooldown = K.slider("Autoscale: cooldown (min)", 1, 30, 5, 1, () => run());
const boot = K.slider("Autoscale: instance boot time (min)", 1, 10, 3, 1, () => run());
const idle = K.slider("Serverless: idle timeout (min)", 1, 30, 10, 1, () => run());
const spike = K.slider("Spike height (x normal)", 1, 10, 4, 0.5, () => run());
const st = K.stats({ cost: "Cost for the day", p95: "p95 latency", over: "Minutes overloaded", cold: "Cold starts", util: "Avg utilisation" });
const chart = K.chart([{ name: "demand (rps)" }, { name: "capacity (rps)" }], { height: 170, points: 1440 / 5 });
const lchart = K.chart([{ name: "latency ms" }], { height: 110, points: 1440 / 5 });

const PER_SERVER = 100, SERVER_HR = 0.10, LAMBDA_PER_M = 0.4;   // rps per server, $/server-hour, $/million requests (incl. compute)
function demand(m) { const h = m / 60; let d = 300 + 500 * Math.max(0, Math.sin(((h - 6) / 18) * Math.PI)); if (h > 12 && h < 13) d *= spike.value; return d * (0.95 + Math.random() * 0.1); }
function run() {
  let servers = mode.value.startsWith("fixed") ? fixedN.value : 5, pending = [], lastScale = -99, cost = 0, over = 0, cold = 0, warm = 0, utilSum = 0;
  const D = [], C = [], L = [], lats = [];
  for (let m = 0; m < 1440; m++) {
    const d = demand(m);
    let cap, latency;
    if (mode.value.startsWith("serverless")) {
      const need = Math.ceil(d / 10);                                  // concurrent instances needed
      if (need > warm) { cold += need - warm; latency = 60 + 400 * Math.min(1, (need - warm) / need); warm = need; } else latency = 60;
      if (m % idle.value === 0) warm = Math.max(need, Math.floor(warm * 0.7));
      cap = d; cost += (d * 60 / 1e6) * LAMBDA_PER_M; utilSum += 1;
    } else {
      pending = pending.filter((p) => { if (p.at <= m) { servers += p.n; return false; } return true; });
      cap = servers * PER_SERVER;
      const u = d / cap; utilSum += Math.min(1, u);
      if (mode.value.startsWith("auto") && m - lastScale >= cooldown.value) {
        const want = Math.ceil(d / (PER_SERVER * target.value / 100));
        const inflight = pending.reduce((a, p) => a + p.n, 0);
        if (want > servers + inflight) { pending.push({ n: want - servers - inflight, at: m + boot.value }); lastScale = m; }
        else if (want < servers * 0.8) { servers = Math.max(2, want); lastScale = m; }
      }
      latency = u < 1 ? 50 / (1 - Math.min(u, 0.95)) * 0.5 + 40 : 2000;
      if (u >= 1) over++;
      cost += (servers * SERVER_HR) / 60;
    }
    lats.push(latency);
    if (m % 5 === 0) { D.push(d); C.push(cap); L.push(latency); }
  }
  lats.sort((a, b) => a - b);
  chart.set([D, C]); lchart.set([L]);
  st.setAll({ cost: "$" + cost.toFixed(2), p95: lats[Math.floor(lats.length * 0.95)].toFixed(0) + " ms", cold, util: ((100 * utilSum) / 1440).toFixed(0) + "%" });
  st.set("over", over, over ? "bad" : "ok");
}
run();
