// Variant 1, no locking: read, then write "what I read + 1". Two users who read the same value both succeed.
import { thinkTime } from "./race.js";

export const noLocking = {
  name: "no locking",
  read(db, now, random) {
    return { writeAt: now + thinkTime(random), snapshot: { ...db.row } };
  },
  write(db, snapshot) {
    if (snapshot.booked >= db.total) return "sold-out";
    db.row.booked = snapshot.booked + 1; // lost update: overwrites whatever others wrote in between
    return "booked";
  },
};
