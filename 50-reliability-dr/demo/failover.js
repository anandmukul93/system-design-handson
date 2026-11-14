// Failover decision: when the primary is gone, promote the replica that has received the most of its log.
// Whatever the old primary had committed beyond that point is lost: that gap is the RPO actually paid.
// lsn = log sequence number: how many writes a region has applied.
export function chooseNewPrimary(regions, oldPrimary) {
  const candidates = regions.filter((r) => r.up && r !== oldPrimary);
  if (!candidates.length) return null;
  return candidates.reduce((best, r) => (r.lsn > best.lsn ? r : best));
}

// returns { promoted, lostWrites } or null if nobody can take over
export function failover(regions) {
  const oldPrimary = regions.find((r) => r.role === "primary");
  const promoted = chooseNewPrimary(regions, oldPrimary);
  if (!promoted) return null;
  const lostWrites = oldPrimary ? Math.max(0, oldPrimary.lsn - promoted.lsn) : 0;
  if (oldPrimary) oldPrimary.role = "replica";
  promoted.role = "primary";
  // the others must throw away anything past the new primary's log before they follow it
  for (const r of regions) if (r !== promoted) r.lsn = Math.min(r.lsn, promoted.lsn);
  return { promoted, lostWrites };
}
