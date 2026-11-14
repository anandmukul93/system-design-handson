// Event-sourced wallet: commands → events → state, replay, snapshots, saga with compensation. Edit me and press Run.
K.title(
  "Digital wallet",
  "Commands are validated and turned into events. State is a fold over the log; replay it, snapshot it, and watch a saga compensate.",
);

const ACCTS = ["alice", "bob", "carol", "dave"];
const SHARD = { alice: 0, bob: 0, carol: 1, dave: 1 };
const events = [];
let state = fresh(),
  snapshot = null;
function fresh() {
  return Object.fromEntries(ACCTS.map((a) => [a, 0]));
}
function apply(s, e) {
  if (e.type === "Deposited") s[e.acct] += e.amt;
  if (e.type === "Debited") s[e.acct] -= e.amt;
  if (e.type === "Credited") s[e.acct] += e.amt;
  return s;
}
function emit(e) {
  e.seq = events.length + 1;
  events.push(e);
  apply(state, e);
}

K.section("Commands");
const from = K.select("From", ACCTS, "alice");
const to = K.select("To", ACCTS, "carol");
const amt = K.slider("Amount", 1, 200, 30, 1);
K.button(
  "Deposit to From",
  () => {
    emit({ type: "Deposited", acct: from.value, amt: amt.value });
    log.add(`Deposit ${amt.value} → ${from.value}`, "ok");
    render();
  },
  "primary",
);
K.button("Transfer", () => transfer(false));
K.button("Cross-shard transfer that fails midway", () => transfer(true), "danger");
K.section("Log");
K.button("Snapshot now", () => {
  snapshot = { seq: events.length, state: { ...state } };
  log.add(`snapshot at seq ${snapshot.seq}`, "ok");
  render();
});
K.button("Replay from scratch", () => replay(false));
K.button("Replay from snapshot", () => replay(true));
const st = K.stats({
  events: "Events",
  total: "Sum of balances",
  deposits: "Sum of deposits",
  replay: "Last replay applied",
});
const table = K.table(["Account", "Shard", "Balance"]);
const evlog = K.code("");
const log = K.log(90);

function transfer(failMid) {
  const f = from.value,
    t = to.value,
    a = amt.value;
  if (f === t) return log.add("rejected: same account", "bad");
  if (state[f] < a)
    return log.add(`rejected: ${f} has ${state[f]} < ${a} (command validation, no event written)`, "bad");
  const tx = "tx" + events.length;
  emit({ type: "Debited", acct: f, amt: a, tx }); // step 1 on shard of f
  if (failMid) {
    log.add(`${tx}: debit on shard ${SHARD[f]} ok, credit on shard ${SHARD[t]} FAILED`, "bad");
    emit({ type: "Credited", acct: f, amt: a, tx, compensation: true }); // compensating event, never delete
    log.add(`${tx}: compensating credit back to ${f}`, "warn");
  } else {
    emit({ type: "Credited", acct: t, amt: a, tx });
    log.add(`${tx}: ${f} → ${t} ${a}${SHARD[f] !== SHARD[t] ? " (cross-shard saga, 2 steps)" : ""}`, "ok");
  }
  render();
}
function replay(fromSnap) {
  const t0 = performance.now();
  const base = fromSnap && snapshot ? { ...snapshot.state } : fresh();
  const startAt = fromSnap && snapshot ? snapshot.seq : 0;
  const s = events.slice(startAt).reduce(apply, base);
  const same = ACCTS.every((a) => s[a] === state[a]);
  st.set(
    "replay",
    `${events.length - startAt} events${same ? ", identical ✓" : ", DIFFERENT"}`,
    same ? "ok" : "bad",
  );
  log.add(
    `replayed ${events.length - startAt} events${fromSnap && snapshot ? ` on top of snapshot @${snapshot.seq}` : ""} in ${(performance.now() - t0).toFixed(2)} ms`,
    "ok",
  );
}
function render() {
  const total = ACCTS.reduce((x, a) => x + state[a], 0),
    dep = events.filter((e) => e.type === "Deposited").reduce((x, e) => x + e.amt, 0);
  st.setAll({ events: events.length, deposits: dep });
  st.set("total", total, total === dep ? "ok" : "bad");
  table.set(ACCTS.map((a) => [a, SHARD[a], state[a]]));
  evlog.set(
    events
      .slice(-8)
      .map(
        (e) =>
          `#${e.seq} ${e.type}(${e.acct}, ${e.amt}${e.tx ? ", " + e.tx : ""}${e.compensation ? ", compensation" : ""})`,
      )
      .join("\n") || "no events",
  );
}
for (const a of ACCTS) emit({ type: "Deposited", acct: a, amt: 100 });
render();
