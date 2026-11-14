// UI only: PSP failure sliders, checkout buttons and tables for payments and ledger entries.
import { MockPsp } from "./psp.js";
import { Ledger } from "./ledger.js";
import { PaymentService } from "./payment_service.js";
import { reconcile, doubleCharges } from "./reconciliation.js";

K.title(
  "Payment system",
  "Checkouts call a flaky PSP. Retries reuse the idempotency key; the ledger must balance; reconciliation finds drift.",
);

const psp = new MockPsp(Math.random);
const ledger = new Ledger();
const service = new PaymentService(psp, ledger);

K.section("PSP behaviour");
const declinePct = K.slider("Decline %", 0, 50, 10, 1);
const timeoutPct = K.slider("Timeout % (charge may still have happened)", 0, 50, 20, 1);
const idempotent = K.toggle("Send idempotency key on retry", true);
K.section("Checkout");
const amount = K.slider("Amount ($)", 1, 500, 40, 1);
K.button("Checkout", () => checkout(amount.value), "primary");
K.button("10 checkouts", () => {
  for (let i = 0; i < 10; i++) checkout(5 + Math.floor(Math.random() * 200));
});
K.button("Run reconciliation", runReconciliation);
const st = K.stats({
  ok: "Succeeded",
  failed: "Failed",
  dup: "Double charges",
  ledger: "Ledger debit − credit",
  drift: "Recon mismatches",
});
const table = K.table(["Payment", "Amount", "State history"]);
const ledgerTable = K.table(["Payment", "Account", "Debit", "Credit"]);
const log = K.log(90);

function checkout(dollars) {
  const { payment, events } = service.checkout(dollars, {
    useIdempotencyKey: idempotent.value,
    declinePercent: declinePct.value,
    timeoutPercent: timeoutPct.value,
  });
  for (const e of events) {
    if (e.type === "timeout") log.add(`${payment.id}: PSP timed out (attempt ${e.attempt})`, "warn");
    else log.add(`${payment.id}: retry returned the original charge ${e.ref} (idempotent)`, "ok");
  }
  render();
}
function runReconciliation() {
  const mismatches = reconcile(psp.charges, ledger.totals());
  for (const m of mismatches)
    log.add(`recon: PSP settled $${m.settled} for ${m.paymentId}, ledger has $${m.recorded}`, "bad");
  if (!mismatches.length) log.add("recon: ledger matches the PSP settlement file", "ok");
  st.set("drift", mismatches.length, mismatches.length ? "bad" : "ok");
}
function render() {
  const states = service.payments.map((p) => service.finalState(p));
  const duplicates = doubleCharges(psp.charges);
  st.setAll({
    ok: states.filter((s) => s === "succeeded").length,
    failed: states.filter((s) => s === "failed").length,
  });
  st.set("dup", duplicates, duplicates ? "bad" : "ok");
  st.set("ledger", "$" + ledger.balance(), ledger.balance() ? "bad" : "ok");
  table.set(service.payments.slice(0, 6).map((p) => [p.id, "$" + p.amount, p.history.join(" → ")]));
  ledgerTable.set(
    ledger.entries.slice(-6).map((e) => [e.paymentId, e.account, e.debit || "", e.credit || ""]),
  );
}
checkout(40);
log.add("Turn the idempotency key off and run 10 checkouts with timeouts: double charges appear.", "muted");
