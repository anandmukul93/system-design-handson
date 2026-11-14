// UI only: pick a strategy, run the race, and compare outcomes.
// Contract every strategy implements:  read(db, now, random) -> { writeAt, snapshot }   write(db, snapshot) -> outcome
import { runRace } from "./race.js";
import { noLocking } from "./no_locking.js";
import { pessimistic } from "./pessimistic.js";
import { optimistic } from "./optimistic.js";
import { dbConstraint } from "./db_constraint.js";

K.title(
  "Hotel reservation",
  "Many users race for the last rooms. Compare no locking, pessimistic, optimistic and a DB constraint.",
);

const STRATEGIES = {
  "no locking": noLocking,
  "pessimistic (SELECT ... FOR UPDATE)": pessimistic,
  "optimistic (version column)": optimistic,
  "DB constraint (CHECK booked ≤ total)": dbConstraint,
};

K.section("Setup");
const rooms = K.slider("Rooms left", 1, 20, 5, 1);
const users = K.slider("Concurrent users", 2, 100, 40, 1);
const mode = K.select("Strategy", Object.keys(STRATEGIES), "no locking");
K.button("Run the race", race, "primary");
const st = K.stats({
  booked: "Reservations written",
  over: "Overbooked",
  retries: "Retries / conflicts",
  rejected: "Told sold out",
  time: "Sim time (ms)",
});
const bars = K.bars(140);
const log = K.log(120);
const timeByStrategy = {};

function race() {
  const strategy = STRATEGIES[mode.value];
  const seed = users.value * 31 + rooms.value; // same seed for every strategy, so the comparison is fair
  const r = runRace(strategy, { rooms: rooms.value, users: users.value, seed }, K.rng);
  st.setAll({ booked: r.written, retries: r.conflicts, rejected: r.soldOut, time: r.finishedAt.toFixed(0) });
  st.set("over", r.overbooked, r.overbooked ? "bad" : "ok");
  timeByStrategy[strategy.name] = r.finishedAt;
  bars.draw(
    Object.entries(timeByStrategy).map(([name, ms], i) => ({
      label: name + " ms",
      value: Math.round(ms),
      color: i,
    })),
  );
  const doubleBooked = r.overbooked ? ` → ${r.overbooked} DOUBLE BOOKINGS` : "";
  log.add(
    `${mode.value}: ${r.written} reservations for ${rooms.value} rooms${doubleBooked}, ${r.conflicts} conflicts, done in ${r.finishedAt.toFixed(0)} ms`,
    r.overbooked ? "bad" : "ok",
  );
}
race();
log.add("Bars compare total time per strategy: pessimistic serializes everyone behind the lock.", "muted");
