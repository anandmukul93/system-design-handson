// The wallet service: commands are validated against current state, then turned into appended events.
// A transfer is a two-step saga (debit, then credit); if the credit fails, a compensating event undoes the debit.
import { emptyState, apply } from "./events.js";

export class Wallet {
  constructor(accounts, shardOf) {
    this.accounts = accounts;
    this.shardOf = shardOf; // account -> shard number
    this.events = [];
    this.state = emptyState(accounts);
    this.snapshot = null;
  }
  append(event) {
    event.seq = this.events.length + 1;
    this.events.push(event);
    apply(this.state, event);
    return event;
  }
  deposit(account, amount) {
    return this.append({ type: "Deposited", account, amount });
  }
  // returns { ok, reason?, tx?, crossShard?, compensated? }
  transfer(from, to, amount, { creditFails = false } = {}) {
    if (from === to) return { ok: false, reason: "same account" };
    if (this.state[from] < amount)
      return { ok: false, reason: `${from} has ${this.state[from]} < ${amount}` };
    const tx = "tx" + this.events.length;
    const crossShard = this.shardOf[from] !== this.shardOf[to];
    this.append({ type: "Debited", account: from, amount, tx }); // step 1, on the sender's shard
    if (creditFails) {
      // step 2 failed: never delete the debit; append an event that reverses it
      this.append({ type: "Credited", account: from, amount, tx, compensation: true });
      return { ok: false, tx, crossShard, compensated: true };
    }
    this.append({ type: "Credited", account: to, amount, tx }); // step 2, on the receiver's shard
    return { ok: true, tx, crossShard };
  }
  takeSnapshot() {
    this.snapshot = { seq: this.events.length, state: { ...this.state } };
    return this.snapshot;
  }
  totalBalance() {
    return this.accounts.reduce((sum, a) => sum + this.state[a], 0);
  }
  totalDeposited() {
    return this.events.filter((e) => e.type === "Deposited").reduce((sum, e) => sum + e.amount, 0);
  }
}
