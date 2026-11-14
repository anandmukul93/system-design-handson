// UI only: a query builder, two charts and an alert rule, on top of TimeSeriesDB and AlertRule.
import { TimeSeriesDB, downsample, aggregate } from "./tsdb.js";
import { AlertRule } from "./alert_rule.js";
import { HOSTS, cpuReading } from "./hosts.js";

K.title(
  "Metrics and alerting",
  "Hosts emit cpu{host,region}. Query with a label filter and aggregation, downsample, and watch an alert go pending then firing.",
);

const db = new TimeSeriesDB(600);
const series = HOSTS.map((labels) => db.addSeries(labels));
const rule = new AlertRule();
const FILTERS = {
  "{}": {},
  '{region="us"}': { region: "us" },
  '{region="eu"}': { region: "eu" },
  '{host="db-1"}': { host: "db-1" },
};
const VISIBLE_POINTS = 120;
let t = 0;
let spikeSecondsLeft = 0;

K.section("Query");
const filter = K.select("Label filter", Object.keys(FILTERS), "{}");
const agg = K.select("Aggregation", ["avg", "max", "sum"], "avg");
const step = K.slider("Downsample step (s)", 1, 30, 1, 1);
const queryText = K.code("");
const chart = K.chart([{ name: "result" }, { name: "threshold", color: "bad" }], { height: 170, max: 110 });
const perHost = K.chart(
  HOSTS.map((h) => ({ name: h.host })),
  { height: 130, max: 110 },
);
K.section("Alert rule");
const threshold = K.slider("Threshold (cpu %)", 10, 100, 80, 1);
const forSeconds = K.slider("for (seconds)", 0, 30, 10, 1);
K.button(
  "CPU spike on web-1 (20 s)",
  () => {
    spikeSecondsLeft = 20;
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

const recent = (s) => downsample(s.points.slice(-VISIBLE_POINTS * step.value), step.value);
K.loop(() => {
  t++;
  series.forEach((s, i) => db.append(s, t, cpuReading(i, t, spikeSecondsLeft > 0)));
  spikeSecondsLeft = Math.max(0, spikeSecondsLeft - 1);

  const selected = db.select(FILTERS[filter.value]);
  const result = aggregate(selected.map(recent), agg.value);
  chart.set([result, result.map(() => threshold.value)]);
  perHost.set(series.map(recent));
  const selector = filter.value === "{}" ? "" : filter.value;
  queryText.set(`${agg.value}(cpu_usage${selector})  [step ${step.value}s]  → ${selected.length} series`);

  const current = result.length ? result[result.length - 1] : 0;
  const { state, changedFrom } = rule.evaluate(current, threshold.value, forSeconds.value);
  const color = { firing: "bad", pending: "warn", inactive: "ok" }[state];
  if (changedFrom) log.add(`alert ${changedFrom} → ${state} (value ${current.toFixed(0)})`, color);
  st.set("state", state, color);
  st.setAll({
    since: rule.secondsAbove + " s",
    points: db.pointCount(),
    rate: result.length * selected.length,
  });
}, 250);
log.add("Each tick here is one second of metrics, sped up 4x.", "muted");
