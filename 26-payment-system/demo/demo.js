// Payments: state machine, idempotent retries, double-entry ledger, reconciliation. Edit me and press Run.
K.title("Payment system", "Checkouts call a flaky PSP. Retries reuse the idempotency key; the ledger must balance; reconciliation finds drift.");

K.section("PSP behaviour");
const failP = K.slider("Decline %", 0, 50, 10, 1);
const timeoutP = K.slider("Timeout % (charge may still have happened)", 0, 50, 20, 1);
const idem = K.toggle("Send idempotency key on retry", true);
K.section("Checkout");
const amount = K.slider("Amount ($)", 1, 500, 40, 1);
K.button("Checkout", () => checkout(amount.value), "primary");
K.button("10 checkouts", () => { for (let i = 0; i < 10; i++) checkout(5 + Math.floor(Math.random() * 200)); });
K.button("Run reconciliation", reconcile);
const st = K.stats({ ok: "Succeeded", failed: "Failed", dup: "Double charges", ledger: "Ledger debit − credit", drift: "Recon mismatches" });
const table = K.table(["Payment", "Amount", "State history"]);
const ledgerT = K.table(["Payment", "Account", "Debit", "Credit"]);
const log = K.log(90);
const psp = new Map(), pspCharges = [], payments = [], ledger = [];
let n = 0;

function pspCharge(key, amt) {
  if (psp.has(key)) return { ...psp.get(key), replay: true };          // PSP dedupes by idempotency key
  const r = Math.random() * 100;
  if (r < failP.value) return { status: "declined" };
  pspCharges.push({ key, amt });
  const res = { status: "succeeded", ref: "ch_" + pspCharges.length };
  psp.set(key, res);
  if (r < failP.value + timeoutP.value) return { status: "timeout" };   // charged, but we never heard back
  return res;
}
function checkout(amt) {
  const p = { id: "pay_" + ++n, amt, hist: ["created"] };
  payments.unshift(p);
  for (let attempt = 1; attempt <= 3; attempt++) {
    p.hist.push(attempt === 1 ? "pending" : "retry " + attempt);
    const key = idem.value ? `${n}` : `${n}_${attempt}`;
    const r = pspCharge(key, amt);
    if (r.status === "timeout") { log.add(`${p.id}: PSP timed out (attempt ${attempt})`, "warn"); continue; }
    if (r.status === "declined") { p.hist.push("failed"); break; }
    p.hist.push("succeeded");
    ledger.push({ p: p.id, acct: "customer_card", d: amt, c: 0 }, { p: p.id, acct: "merchant_payable", d: 0, c: amt });   // double entry
    if (r.replay) log.add(`${p.id}: retry returned the original charge ${r.ref} (idempotent)`, "ok");
    break;
  }
  if (!p.hist.includes("succeeded") && !p.hist.includes("failed")) p.hist.push("unknown → needs recon");
  render();
}
function reconcile() {
  const ours = new Map(); for (const p of payments) if (p.hist.includes("succeeded")) ours.set(p.id, p.amt);
  const theirs = new Map(); for (const c of pspCharges) { const id = "pay_" + c.key.split("_")[0]; theirs.set(id, (theirs.get(id) || 0) + c.amt); }
  let mism = 0;
  for (const [id, amt] of theirs) if (ours.get(id) !== amt) { mism++; log.add(`recon: PSP settled $${amt} for ${id}, ledger has $${ours.get(id) || 0}`, "bad"); }
  if (!mism) log.add("recon: ledger matches the PSP settlement file", "ok");
  st.set("drift", mism, mism ? "bad" : "ok");
}
function render() {
  const succ = payments.filter((p) => p.hist.includes("succeeded")).length;
  const per = new Map(); for (const c of pspCharges) { const k = c.key.split("_")[0]; per.set(k, (per.get(k) || 0) + 1); }
  const dup = [...per.values()].filter((v) => v > 1).length;
  const bal = ledger.reduce((a, e) => a + e.d - e.c, 0);
  st.setAll({ ok: succ, failed: payments.filter((p) => p.hist.includes("failed")).length });
  st.set("dup", dup, dup ? "bad" : "ok");
  st.set("ledger", "$" + bal, bal ? "bad" : "ok");
  table.set(payments.slice(0, 6).map((p) => [p.id, "$" + p.amt, p.hist.join(" → ")]));
  ledgerT.set(ledger.slice(-6).map((e) => [e.p, e.acct, e.d || "", e.c || ""]));
}
checkout(40);
log.add("Turn the idempotency key off and run 10 checkouts with timeouts: double charges appear.", "muted");
