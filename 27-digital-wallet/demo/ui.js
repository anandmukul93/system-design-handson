// UI only: command buttons, a balance table and the tail of the event log.
import { Wallet } from "./wallet.js";
import { replay, describe } from "./events.js";

K.title(
  "Digital wallet",
  "Commands are validated and turned into events. State is a fold over the log; replay it, snapshot it, and watch a saga compensate.",
);

const ACCOUNTS = ["alice", "bob", "carol", "dave"];
const SHARD = { alice: 0, bob: 0, carol: 1, dave: 1 };
const wallet = new Wallet(ACCOUNTS, SHARD);

K.section("Commands");
const from = K.select("From", ACCOUNTS, "alice");
const to = K.select("To", ACCOUNTS, "carol");
const amount = K.slider("Amount", 1, 200, 30, 1);
K.button(
  "Deposit to From",
  () => {
    wallet.deposit(from.value, amount.value);
    log.add(`Deposit ${amount.value} → ${from.value}`, "ok");
    render();
  },
  "primary",
);
K.button("Transfer", () => transfer(false));
K.button("Cross-shard transfer that fails midway", () => transfer(true), "danger");
K.section("Log");
K.button("Snapshot now", () => {
  log.add(`snapshot at seq ${wallet.takeSnapshot().seq}`, "ok");
});
K.button("Replay from scratch", () => runReplay(null));
K.button("Replay from snapshot", () => runReplay(wallet.snapshot));
const st = K.stats({
  events: "Events",
  total: "Sum of balances",
  deposits: "Sum of deposits",
  replay: "Last replay applied",
});
const table = K.table(["Account", "Shard", "Balance"]);
const eventLog = K.code("");
const log = K.log(90);

function transfer(creditFails) {
  const r = wallet.transfer(from.value, to.value, amount.value, { creditFails });
  if (r.reason) log.add(`rejected: ${r.reason} (command validation, no event written)`, "bad");
  else if (r.compensated) {
    log.add(
      `${r.tx}: debit on shard ${SHARD[from.value]} ok, credit on shard ${SHARD[to.value]} FAILED`,
      "bad",
    );
    log.add(`${r.tx}: compensating credit back to ${from.value}`, "warn");
  } else {
    const note = r.crossShard ? " (cross-shard saga, 2 steps)" : "";
    log.add(`${r.tx}: ${from.value} → ${to.value} ${amount.value}${note}`, "ok");
  }
  render();
}
function runReplay(snapshot) {
  const started = performance.now();
  const { state, applied } = replay(wallet.events, ACCOUNTS, snapshot);
  const identical = ACCOUNTS.every((a) => state[a] === wallet.state[a]);
  st.set(
    "replay",
    `${applied} events${identical ? ", identical ✓" : ", DIFFERENT"}`,
    identical ? "ok" : "bad",
  );
  const onTop = snapshot ? ` on top of snapshot @${snapshot.seq}` : "";
  log.add(`replayed ${applied} events${onTop} in ${(performance.now() - started).toFixed(2)} ms`, "ok");
}
function render() {
  st.setAll({ events: wallet.events.length, deposits: wallet.totalDeposited() });
  st.set("total", wallet.totalBalance(), wallet.totalBalance() === wallet.totalDeposited() ? "ok" : "bad");
  table.set(ACCOUNTS.map((a) => [a, SHARD[a], wallet.state[a]]));
  eventLog.set(wallet.events.slice(-8).map(describe).join("\n") || "no events");
}
for (const a of ACCOUNTS) wallet.deposit(a, 100);
render();
