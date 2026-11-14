// Races, deadlock and fencing tokens. Edit me and press Run.
K.title("Concurrency and locking", "Lost updates on a counter, dining philosophers deadlocking, and a GC pause breaking a distributed lock.");

// ---- 1. lost updates ----
K.section("1. Shared counter");
const threads = K.slider("Threads", 2, 16, 8, 1);
const incs = K.slider("Increments per thread", 10, 2000, 500, 10);
const useLock = K.toggle("Use a lock (read-modify-write is atomic)", false);
K.button("Race", race, "primary");
const cst = K.stats({ want: "Expected", got: "Actual", lost: "Lost updates" });
function race() {
  // interleave read/write steps randomly, like a preemptive scheduler would
  let counter = 0; const rnd = K.rng(Date.now());
  const ts = Array.from({ length: threads.value }, () => ({ left: incs.value, reg: null }));
  while (ts.some((t) => t.left)) {
    const t = ts[Math.floor(rnd() * ts.length)]; if (!t.left) continue;
    if (useLock.value) { counter++; t.left--; continue; }
    if (t.reg === null) t.reg = counter;                     // read
    else { counter = t.reg + 1; t.reg = null; t.left--; }    // write (may overwrite others' work)
  }
  const want = threads.value * incs.value;
  cst.setAll({ want, got: counter }); cst.set("lost", want - counter, want - counter ? "bad" : "ok");
}
race();

// ---- 2. dining philosophers ----
K.section("2. Dining philosophers");
const ordered = K.toggle("Lock ordering (always pick the lower-numbered fork first)", false, () => reset());
K.button("Restart", () => reset());
const cv = K.canvas(220, () => draw());
const dst = K.stats({ meals: "Meals eaten", state: "State" });
const P = 5;
let forks, phil, meals, stuck;
function reset() { forks = Array(P).fill(null); phil = Array.from({ length: P }, () => ({ s: "think", t: 0, hold: [] })); meals = 0; stuck = 0; }
function stepPhil() {
  const rnd = Math.random;
  for (let i = 0; i < P; i++) {
    const p = phil[i], L = i, R = (i + 1) % P;
    const [first, second] = ordered.value ? [Math.min(L, R), Math.max(L, R)] : [L, R];
    if (p.s === "think") { if (--p.t <= 0) p.s = "hungry"; continue; }
    if (p.s === "hungry") {
      if (!p.hold.includes(first)) { if (forks[first] === null) { forks[first] = i; p.hold.push(first); } continue; }
      if (forks[second] === null) { forks[second] = i; p.hold.push(second); p.s = "eat"; p.t = 3 + Math.floor(rnd() * 3); }
      continue;
    }
    if (p.s === "eat" && --p.t <= 0) { meals++; p.hold.forEach((f) => (forks[f] = null)); p.hold = []; p.s = "think"; p.t = 1 + Math.floor(rnd() * 2); }
  }
  const deadlocked = phil.every((p) => p.s === "hungry" && p.hold.length === 1);
  dst.set("meals", meals); dst.set("state", deadlocked ? "DEADLOCK: every philosopher holds one fork and waits for the next" : "running", deadlocked ? "bad" : "ok");
  draw(deadlocked);
}
function draw(dead) {
  const { ctx, width } = cv; cv.clear();
  const cx = width / 2, cy = 110, pos = (k, r, off = 0) => [cx + r * Math.cos(((k + off) / P) * 2 * Math.PI - Math.PI / 2), cy + r * Math.sin(((k + off) / P) * 2 * Math.PI - Math.PI / 2)];
  ctx.font = "11px system-ui"; ctx.textAlign = "center";
  for (let f = 0; f < P; f++) { const [x, y] = pos(f, 55, 0.5); ctx.fillStyle = K.color(forks[f] === null ? "muted" : "c2"); ctx.fillRect(x - 3, y - 12, 6, 24); ctx.fillText("f" + f, x, y + 24); }
  phil.forEach((p, i) => {
    const [x, y] = pos(i, 90);
    ctx.fillStyle = K.color(p.s === "eat" ? "ok" : p.s === "hungry" ? (dead ? "bad" : "warn") : "c1");
    ctx.beginPath(); ctx.arc(x, y, 16, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText("P" + i, x, y + 4);
    if (dead) { const [x2, y2] = pos((i + 1) % P, 90); ctx.strokeStyle = K.color("bad"); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); }
  });
  ctx.textAlign = "start"; if (dead) { ctx.fillStyle = K.color("bad"); ctx.fillText("wait-for graph has a cycle", 6, 214); }
}
reset(); K.loop(stepPhil, 300);

// ---- 3. fencing tokens ----
K.section("3. Distributed lock + GC pause");
const fencing = K.toggle("Storage checks fencing tokens", false);
K.button("Replay the scenario", fence, "primary");
const flog = K.log(130);
function fence() {
  flog.clear(); let lastToken = 0; const store = [];
  const write = (who, tok, v) => {
    if (fencing.value && tok < lastToken) return flog.add(`storage rejects ${who}'s write: token ${tok} < ${lastToken}`, "ok");
    lastToken = Math.max(lastToken, tok); store.push(v); flog.add(`storage accepts ${who}: "${v}" (token ${tok})`, store.length > 1 && !fencing.value ? "bad" : "ok");
  };
  flog.add("t=0  client A acquires lease (10 s), token 33", "muted");
  flog.add("t=1  client A stops for a 15 s GC pause", "warn");
  flog.add("t=10 lease expires; client B acquires it, token 34", "muted");
  write("B", 34, "B's update");
  flog.add("t=16 client A wakes up, still believes it holds the lock", "warn");
  write("A", 33, "A's stale update");
  if (!fencing.value) flog.add("both clients wrote while 'holding' the lock: data corrupted", "bad");
}
fence();
