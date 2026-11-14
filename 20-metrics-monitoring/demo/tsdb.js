// A tiny time-series database: each series is a label set plus [timestamp, value] points.
// Supports label filters, downsampling and aggregation across series.
export class TimeSeriesDB {
  constructor(retentionPoints = 600) {
    this.series = []; // { labels, points: [[t, value]] }
    this.retention = retentionPoints;
  }
  addSeries(labels) {
    const s = { labels, points: [] };
    this.series.push(s);
    return s;
  }
  append(series, t, value) {
    series.points.push([t, value]);
    if (series.points.length > this.retention) series.points.shift();
  }
  // filter like { region: "us" }; an empty filter matches everything
  select(filter) {
    return this.series.filter((s) => Object.entries(filter).every(([k, v]) => s.labels[k] === v));
  }
  pointCount() {
    return this.series.reduce((a, s) => a + s.points.length, 0);
  }
}

// average each `step` consecutive points into one: fewer points to store, draw and scan
export function downsample(points, step) {
  const out = [];
  for (let i = 0; i < points.length; i += step) {
    const bucket = points.slice(i, i + step);
    out.push(bucket.reduce((a, p) => a + p[1], 0) / bucket.length);
  }
  return out;
}

export const AGGREGATIONS = {
  avg: (values) => values.reduce((a, b) => a + b, 0) / values.length,
  max: (values) => Math.max(...values),
  sum: (values) => values.reduce((a, b) => a + b, 0),
};

// combine several series (already downsampled, as arrays of numbers) into one, aligned on the newest point
export function aggregate(columns, aggregationName) {
  if (!columns.length) return [];
  const fn = AGGREGATIONS[aggregationName];
  const length = Math.min(...columns.map((c) => c.length));
  return Array.from({ length }, (_, j) => fn(columns.map((c) => c[c.length - length + j])));
}
