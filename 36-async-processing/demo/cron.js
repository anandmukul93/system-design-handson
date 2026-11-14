// A cron expression evaluator: "minute hour day-of-month month day-of-week".
// Each field supports *, a-b, a,b,c and /step.
const FIELD_RANGES = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 6],
];

// "*/15" with range 0..59 -> Set {0, 15, 30, 45}
export function parseField(text, low, high) {
  const values = new Set();
  for (const part of text.split(",")) {
    const [range, stepText] = part.split("/");
    const step = Number(stepText || 1);
    let [from, to] = range === "*" ? [low, high] : range.split("-").map(Number);
    if (to === undefined) to = stepText ? high : from;
    if ([from, to, step].some(Number.isNaN) || step < 1) throw new Error("bad field: " + part);
    for (let v = from; v <= to; v += step) values.add(v);
  }
  return values;
}

export function parseCron(expression) {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) throw new Error("need 5 fields");
  const [minute, hour, dayOfMonth, month, dayOfWeek] = fields.map((f, i) =>
    parseField(f, ...FIELD_RANGES[i]),
  );
  return { minute, hour, dayOfMonth, month, dayOfWeek };
}

export function matches(cron, date) {
  return (
    cron.minute.has(date.getMinutes()) &&
    cron.hour.has(date.getHours()) &&
    cron.dayOfMonth.has(date.getDate()) &&
    cron.month.has(date.getMonth() + 1) &&
    cron.dayOfWeek.has(date.getDay())
  );
}

// the next `count` run times after `from`, found by checking minute by minute for up to a year
export function nextRuns(expression, from, count = 10) {
  const cron = parseCron(expression);
  const date = new Date(from);
  date.setSeconds(0, 0);
  const runs = [];
  for (let i = 0; i < 60 * 24 * 366 && runs.length < count; i++) {
    date.setMinutes(date.getMinutes() + 1);
    if (matches(cron, date)) runs.push(new Date(date));
  }
  return runs;
}
