// Quorum arithmetic behind CAP: what can a client do when it reaches only some of the N replicas?
export function quorumOutcome({ n, w, r, reachable }) {
  w = Math.min(w, n);
  r = Math.min(r, n);
  reachable = Math.min(reachable, n);
  const overlap = w + r > n; // every read set shares at least one replica with every write set
  const canWrite = reachable >= w;
  const canRead = reachable >= r;
  let behaviour;
  if (!overlap) behaviour = "AP: answers, may be stale";
  else if (canWrite && canRead) behaviour = "CP, and this side has a majority";
  else behaviour = "CP: refuses rather than lies";
  return { canWrite, canRead, overlap, behaviour };
}
