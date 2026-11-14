// UI only: three panels for the counter race, the philosophers' table and the fencing scenario.
import { unsafeIncrement, lockedIncrement, runThreads } from "./counter_race.js";
import { Table } from "./philosophers.js";
import { gcPauseScenario } from "./fencing.js";

K.title(
  "Concurrency and locking",
  "Lost updates on a counter, dining philosophers deadlocking, and a GC pause breaking a distributed lock.",
);

// ---- 1. lost updates ----
K.section("1. Shared counter");
const threads = K.slider("Threads", 2, 16, 8, 1);
const increments = K.slider("Increments per thread", 10, 2000, 500, 10);
const useLock = K.toggle("Use a lock (read-modify-write is atomic)", false);
K.button("Race", race, "primary");
const counterStats = K.stats({ expected: "Expected", actual: "Actual", lost: "Lost updates" });
function race() {
  const variant = useLock.value ? lockedIncrement : unsafeIncrement;
  const { expected, actual } = runThreads(threads.value, increments.value, variant, K.rng(Date.now()));
  counterStats.setAll({ expected, actual });
  counterStats.set("lost", expected - actual, expected - actual ? "bad" : "ok");
}
race();

// ---- 2. dining philosophers ----
K.section("2. Dining philosophers");
const SEATS = 5;
const ordered = K.toggle("Lock ordering (always pick the lower-numbered fork first)", false, () => restart());
K.button("Restart", () => restart());
const cv = K.canvas(220, () => draw());
const tableStats = K.stats({ meals: "Meals eaten", state: "State" });
let table;
function restart() {
  table = new Table(SEATS, Math.random, ordered.value);
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const deadlocked = table.isDeadlocked();
  const centerX = width / 2;
  const centerY = 110;
  const position = (seat, radius) => {
    const angle = (seat / SEATS) * 2 * Math.PI - Math.PI / 2;
    return [centerX + radius * Math.cos(angle), centerY + radius * Math.sin(angle)];
  };
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  table.forks.forEach((holder, fork) => {
    const [x, y] = position(fork + 0.5, 55); // fork f sits between philosopher f and f+1
    ctx.fillStyle = K.color(holder === null ? "muted" : "c2");
    ctx.fillRect(x - 3, y - 12, 6, 24);
    ctx.fillText("f" + fork, x, y + 24);
  });
  const stateColor = { eating: "ok", hungry: deadlocked ? "bad" : "warn", thinking: "c1" };
  table.philosophers.forEach((p, seat) => {
    const [x, y] = position(seat, 90);
    ctx.fillStyle = K.color(stateColor[p.state]);
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText("P" + seat, x, y + 4);
    if (deadlocked) {
      const [x2, y2] = position((seat + 1) % SEATS, 90);
      ctx.strokeStyle = K.color("bad");
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
  });
  ctx.textAlign = "start";
  if (deadlocked) {
    ctx.fillStyle = K.color("bad");
    ctx.fillText("wait-for graph has a cycle", 6, 214);
  }
}
restart();
K.loop(() => {
  table.step();
  const deadlocked = table.isDeadlocked();
  tableStats.set("meals", table.meals);
  tableStats.set(
    "state",
    deadlocked ? "DEADLOCK: every philosopher holds one fork and waits for the next" : "running",
    deadlocked ? "bad" : "ok",
  );
  draw();
}, 300);

// ---- 3. fencing tokens ----
K.section("3. Distributed lock + GC pause");
const fencing = K.toggle("Storage checks fencing tokens", false);
K.button("Replay the scenario", showFencing, "primary");
const fencingLog = K.log(130);
function showFencing() {
  fencingLog.clear();
  for (const s of gcPauseScenario(fencing.value)) fencingLog.add(s.text, s.kind);
}
showFencing();
