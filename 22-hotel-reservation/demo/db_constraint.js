// Variant 4, database constraint: UPDATE booked = booked + 1 with CHECK (booked <= total). The DB says no.
import { thinkTime } from "./race.js";

export const dbConstraint = {
  name: "constraint",
  read(db, now, random) {
    return { writeAt: now + thinkTime(random), snapshot: { ...db.row } };
  },
  write(db, snapshot) {
    if (snapshot.booked >= db.total) return "sold-out";
    if (db.row.booked + 1 > db.total) return "sold-out"; // constraint violation → the app reports sold out
    db.row.booked++; // atomic increment inside the database
    return "booked";
  },
};
