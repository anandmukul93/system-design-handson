// Two ways to survive lost nodes, with the same contract: describe() -> { overhead, tolerates, readsToRepair }
// Variant 1: replication stores whole copies.
export function replication(copies) {
  return { overhead: copies, tolerates: copies - 1, readsToRepair: 1 };
}
// Variant 2: erasure coding splits data into k pieces and adds m parity pieces; any k of the k+m rebuild it.
export function erasureCoding(dataPieces, parityPieces) {
  return {
    overhead: (dataPieces + parityPieces) / dataPieces,
    tolerates: parityPieces,
    readsToRepair: dataPieces,
  };
}
