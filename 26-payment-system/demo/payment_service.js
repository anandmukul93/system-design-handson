// The payment state machine: created → pending → (retry…) → succeeded | failed | unknown.
// A timeout is retried; whether the retry reuses the idempotency key decides if the customer pays twice.
const MAX_ATTEMPTS = 3;

export class PaymentService {
  constructor(psp, ledger) {
    this.psp = psp;
    this.ledger = ledger;
    this.payments = []; // { id, amount, history: [state] }
    this.count = 0;
  }
  // options: { useIdempotencyKey, declinePercent, timeoutPercent }.  Returns { payment, events }.
  checkout(amount, options) {
    const payment = { id: "pay_" + ++this.count, amount, history: ["created"] };
    this.payments.unshift(payment);
    const events = [];
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      payment.history.push(attempt === 1 ? "pending" : "retry " + attempt);
      const key = options.useIdempotencyKey ? payment.id : `${payment.id}#${attempt}`;
      const result = this.psp.charge(key, payment.id, amount, options);
      if (result.status === "timeout") {
        events.push({ type: "timeout", attempt });
        continue;
      }
      if (result.status === "declined") {
        payment.history.push("failed");
        return { payment, events };
      }
      payment.history.push("succeeded");
      this.ledger.record(payment.id, amount);
      if (result.replay) events.push({ type: "idempotent-replay", ref: result.ref });
      return { payment, events };
    }
    payment.history.push("unknown → needs recon"); // every attempt timed out: we do not know if money moved
    return { payment, events };
  }
  finalState(payment) {
    return payment.history[payment.history.length - 1];
  }
}
