// Variant 3, optimistic locking: no lock; the UPDATE only applies if the version is still the one we read.
import { thinkTime } from "./race.js";

export const optimistic = {
  name: "optimistic",
  read(db, now, random) {
    return { writeAt: now + thinkTime(random), snapshot: { ...db.row } };
  },
  write(db, snapshot) {
    if (snapshot.booked >= db.total) return "sold-out";
    if (db.row.version !== snapshot.version) return "retry"; // UPDATE ... WHERE version = ? matched 0 rows
    db.row.booked++;
    db.row.version++;
    return "booked";
  },
};
