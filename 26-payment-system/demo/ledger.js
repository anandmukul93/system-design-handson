// Double-entry ledger: every payment writes a debit and a credit of the same amount, so the sum is always 0.
export class Ledger {
  constructor() {
    this.entries = []; // { paymentId, account, debit, credit }
  }
  record(paymentId, amount) {
    this.entries.push(
      { paymentId, account: "customer_card", debit: amount, credit: 0 },
      { paymentId, account: "merchant_payable", debit: 0, credit: amount },
    );
  }
  balance() {
    return this.entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
  }
  // total recorded per payment id
  totals() {
    const out = new Map();
    for (const e of this.entries) if (e.debit) out.set(e.paymentId, (out.get(e.paymentId) || 0) + e.debit);
    return out;
  }
}
