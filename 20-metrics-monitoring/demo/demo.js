// Metrics pipeline: labels, aggregation, downsampling, alert rule with "for". Edit me and press Run.
K.title(
  "Metrics and alerting",
  "Hosts emit cpu{host,region}. Query with a label filter and aggregation, downsample, and watch an alert go pending then firing.",
);

const HOSTS = [
  ["web-1", "us"],
  ["web-2", "us"],
  ["web-3", "eu"],
  ["db-1", "eu"],
];
const series = HOSTS.map(([host, region]) => ({ labels: { host, region }, pts: [] }));
let t = 0,
  spike = 0;
K.section("Query");
const filter = K.select("Label filter", ["{}", '{region="us"}', '{region="eu"}', '{host="db-1"}'], "{}");
const agg = K.select("Aggregation", ["avg", "max", "sum", "none (per series)"], "avg");
const step = K.slider("Downsample step (s)", 1, 30, 1, 1);
const q = K.code("");
const chart = K.chart([{ name: "result" }, { name: "threshold", color: "bad" }], { height: 170, max: 110 });
const chart2 = K.chart(
  HOSTS.map(([h]) => ({ name: h })),
  { height: 130, max: 110 },
);
K.section("Alert rule");
const thr = K.slider("Threshold (cpu %)", 10, 100, 80, 1);
const forS = K.slider("for (seconds)", 0, 30, 10, 1);
K.button(
  "CPU spike on web-1 (20 s)",
  () => {
    spike = 20;
    log.add("web-1 starts burning CPU", "warn");
  },
  "danger",
);
const st = K.stats({
  state: "Alert state",
  since: "Above threshold for",
  points: "Stored points",
  rate: "Points per query",
});
const log = K.log(80);
let above = 0,
  state = "inactive";

function match(lbl) {
  const m = filter.value.match(/(\w+)="([^"]+)"/);
  return !m || lbl[m[1]] === m[2];
}
K.loop(() => {
  t++;
  series.forEach((s, i) => {
    let v = 25 + 10 * Math.sin((t + i * 7) / 9) + Math.random() * 8 + (i === 3 ? 15 : 0);
    if (i === 0 && spike > 0) v = 92 + Math.random() * 6;
    s.pts.push([t, v]);
    if (s.pts.length > 600) s.pts.shift();
  });
  spike = Math.max(0, spike - 1);
  const sel = series.filter((s) => match(s.labels));
  const down = (pts) => {
    const out = [];
    for (let i = 0; i < pts.length; i += step.value) {
      const b = pts.slice(i, i + step.value);
      out.push(b.reduce((a, p) => a + p[1], 0) / b.length);
    }
    return out;
  };
  const cols = sel.map((s) => down(s.pts.slice(-120 * step.value)));
  const n = Math.min(...cols.map((c) => c.length));
  const f =
    {
      avg: (a) => a.reduce((x, y) => x + y, 0) / a.length,
      max: (a) => Math.max(...a),
      sum: (a) => a.reduce((x, y) => x + y, 0),
    }[agg.value] || ((a) => Math.max(...a));
  const res = Array.from({ length: n }, (_, j) => f(cols.map((c) => c[c.length - n + j])));
  chart.set([res, res.map(() => thr.value)]);
  chart2.set(series.map((s) => down(s.pts.slice(-120 * step.value))));
  q.set(
    `${agg.value.startsWith("none") ? "" : agg.value + "("}cpu_usage${filter.value === "{}" ? "" : filter.value}${agg.value.startsWith("none") ? "" : ")"}  [step ${step.value}s]  → ${sel.length} series`,
  );
  const cur = res.at(-1) ?? 0;
  above = cur > thr.value ? above + 1 : 0;
  const next = above === 0 ? "inactive" : above >= forS.value ? "firing" : "pending";
  if (next !== state) {
    log.add(
      `alert ${state} → ${next} (value ${cur.toFixed(0)})`,
      next === "firing" ? "bad" : next === "pending" ? "warn" : "ok",
    );
    state = next;
  }
  st.set("state", state, state === "firing" ? "bad" : state === "pending" ? "warn" : "ok");
  st.setAll({
    since: above + " s",
    points: series.reduce((a, s) => a + s.pts.length, 0),
    rate: n * sel.length,
  });
}, 1000 / 4);
log.add("Each tick here is one second of metrics, sped up 4x.", "muted");
