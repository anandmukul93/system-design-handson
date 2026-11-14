// Variant 2, pessimistic locking (SELECT ... FOR UPDATE): take the row lock before reading; others queue up.
const LOCK_HOLD_MS = 4;

export const pessimistic = {
  name: "pessimistic",
  read(db, now) {
    const lockAcquired = Math.max(now, db.lockFreeAt); // wait for whoever holds the lock
    db.lockFreeAt = lockAcquired + LOCK_HOLD_MS;
    return { writeAt: db.lockFreeAt, snapshot: null }; // the write re-reads under the lock
  },
  write(db) {
    if (db.row.booked >= db.total) return "sold-out";
    db.row.booked++;
    return "booked";
  },
};
