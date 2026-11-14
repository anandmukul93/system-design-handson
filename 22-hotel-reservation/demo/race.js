// The race: many users each READ the room count, think for a few ms, then WRITE a reservation.
// A strategy decides what read and write do. db = { row: { booked, version }, total, lockFreeAt }
// Contract for a strategy:
//   read(db, now, random)        -> { writeAt, snapshot }   when the write happens and what the user saw
//   write(db, snapshot)          -> "booked" | "sold-out" | "retry"
export function runRace(strategy, { rooms, users, seed }, makeRandom) {
  const random = makeRandom(seed);
  const db = { row: { booked: 0, version: 0 }, total: rooms, lockFreeAt: 0 };
  const result = { written: 0, soldOut: 0, conflicts: 0, finishedAt: 0 };
  const events = []; // { at, phase: "read" | "write", snapshot }
  for (let u = 0; u < users; u++) events.push({ at: random() * 50, phase: "read" });

  while (events.length) {
    events.sort((a, b) => a.at - b.at);
    const event = events.shift();
    const now = (result.finishedAt = event.at);
    if (event.phase === "read") {
      const { writeAt, snapshot } = strategy.read(db, now, random);
      events.push({ at: writeAt, phase: "write", snapshot });
      continue;
    }
    const outcome = strategy.write(db, event.snapshot);
    if (outcome === "booked") result.written++;
    else if (outcome === "sold-out") result.soldOut++;
    else {
      result.conflicts++;
      events.push({ at: now + 1 + random() * 3, phase: "read" }); // start over with a fresh read
    }
  }
  result.overbooked = Math.max(0, result.written - rooms);
  return result;
}

// time a user spends between reading and writing (filling the form, network hops)
export const thinkTime = (random) => 2 + random() * 6;
