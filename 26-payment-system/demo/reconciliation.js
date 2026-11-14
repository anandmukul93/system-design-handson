// Reconciliation: compare what the PSP settled with what our ledger recorded, payment by payment.
export function reconcile(pspCharges, ledgerTotals) {
  const settled = new Map();
  for (const c of pspCharges) settled.set(c.paymentId, (settled.get(c.paymentId) || 0) + c.amount);
  const mismatches = [];
  for (const [paymentId, amount] of settled) {
    const recorded = ledgerTotals.get(paymentId) || 0;
    if (recorded !== amount) mismatches.push({ paymentId, settled: amount, recorded });
  }
  return mismatches;
}

// payments the PSP charged more than once
export function doubleCharges(pspCharges) {
  const perPayment = new Map();
  for (const c of pspCharges) perPayment.set(c.paymentId, (perPayment.get(c.paymentId) || 0) + 1);
  return [...perPayment.values()].filter((n) => n > 1).length;
}
