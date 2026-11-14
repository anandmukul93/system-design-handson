// Concurrency control for the last rooms. Edit me and press Run.
K.title("Hotel reservation", "Many users race for the last rooms. Compare no locking, pessimistic, optimistic and a DB constraint.");

K.section("Setup");
const rooms = K.slider("Rooms left", 1, 20, 5, 1);
const users = K.slider("Concurrent users", 2, 100, 40, 1);
const mode = K.select("Strategy", ["no locking", "pessimistic (SELECT ... FOR UPDATE)", "optimistic (version column)", "DB constraint (CHECK booked ≤ total)"], "no locking");
K.button("Run the race", race, "primary");
const st = K.stats({ booked: "Reservations written", over: "Overbooked", retries: "Retries / conflicts", rejected: "Told sold out", time: "Sim time (ms)" });
const bars = K.bars(140);
const log = K.log(120);
const history = {};

async function race() {
  const total = rooms.value;
  const row = { booked: 0, version: 0 }; let lockHeldUntil = 0;
  let written = 0, retries = 0, rejected = 0, clock = 0;
  const rnd = K.rng(users.value * 31 + total);
  // each user: read → think → write. Times in ms of simulated time.
  const events = [];
  for (let u = 0; u < users.value; u++) events.push({ u, at: rnd() * 50, phase: "read" });
  while (events.length) {
    events.sort((a, b) => a.at - b.at);
    const e = events.shift(); clock = e.at;
    if (mode.value.startsWith("pessimistic")) {
      if (e.phase === "read") { const start = Math.max(clock, lockHeldUntil); lockHeldUntil = start + 4; events.push({ ...e, phase: "write", at: lockHeldUntil, seen: null }); continue; }
      if (row.booked < total) { row.booked++; written++; } else rejected++;
      continue;
    }
    if (e.phase === "read") { events.push({ ...e, phase: "write", at: clock + 2 + rnd() * 6, seen: { ...row } }); continue; }
    if (e.seen.booked >= total) { rejected++; continue; }
    if (mode.value.startsWith("no locking")) { row.booked = e.seen.booked + 1; written++; }             // lost update!
    else if (mode.value.startsWith("optimistic")) {
      if (row.version === e.seen.version) { row.booked++; row.version++; written++; }
      else { retries++; events.push({ ...e, phase: "read", at: clock + 1 + rnd() * 3 }); }
    } else {                                                                                            // constraint
      if (row.booked + 1 <= total) { row.booked++; written++; } else { retries++; rejected++; }
    }
  }
  const over = Math.max(0, written - total);
  st.setAll({ booked: written, retries, rejected, time: clock.toFixed(0) });
  st.set("over", over, over ? "bad" : "ok");
  history[mode.value.split(" ")[0]] = clock;
  bars.draw(Object.entries(history).map(([k, v], i) => ({ label: k + " ms", value: Math.round(v), color: i })));
  log.add(`${mode.value}: ${written} reservations for ${total} rooms${over ? ` → ${over} DOUBLE BOOKINGS` : ""}, ${retries} conflicts, done in ${clock.toFixed(0)} ms`, over ? "bad" : "ok");
}
race();
log.add("Bars compare total time per strategy: pessimistic serializes everyone behind the lock.", "muted");
