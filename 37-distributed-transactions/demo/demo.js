// 2PC vs saga for a trip booking, plus the transactional outbox. Edit me and press Run.
K.title("Distributed transactions", "Book flight + hotel + car. Make one service fail and compare two-phase commit with a saga. Then crash the outbox relay.");

const SVCS = ["flight", "hotel", "car"];
K.section("Trip booking");
const failing = K.select("Failing service", ["none", ...SVCS], "car");
const proto = K.select("Protocol", ["2PC", "saga (orchestrated)"], "saga (orchestrated)");
const coordCrash = K.toggle("2PC: coordinator crashes after PREPARE", false);
K.button("Book trip", book, "primary");
const table = K.table(["Service", "State"]);
const log = K.log(150);

function book() {
  log.clear();
  const state = Object.fromEntries(SVCS.map((s) => [s, "–"]));
  const show = () => table.set(SVCS.map((s) => [s, K.chip(state[s], /commit|booked/.test(state[s]) ? "ok" : /abort|cancel/.test(state[s]) ? "warn" : /lock|prepared/.test(state[s]) ? "c5" : "muted")]));
  if (proto.value === "2PC") {
    log.add("phase 1: coordinator sends PREPARE to all", "muted");
    let allYes = true;
    for (const s of SVCS) {
      if (failing.value === s) { state[s] = "voted NO"; allYes = false; log.add(`${s}: cannot reserve → NO`, "bad"); }
      else { state[s] = "prepared (locks held)"; log.add(`${s}: reserved and locked → YES`, "ok"); }
    }
    if (coordCrash.value) { log.add("coordinator crashed before deciding: participants stay prepared, holding locks, blocked until it recovers", "bad"); return show(); }
    log.add(`phase 2: ${allYes ? "COMMIT" : "ABORT"} to all`, allYes ? "ok" : "warn");
    for (const s of SVCS) state[s] = allYes ? "committed" : "aborted (locks released)";
    return show();
  }
  const done = [];
  for (const s of SVCS) {
    if (failing.value === s) {
      state[s] = "failed"; log.add(`${s}: booking failed → run compensations in reverse`, "bad");
      for (const d of done.reverse()) { state[d] = "cancelled (compensated)"; log.add(`compensate: cancel ${d}`, "warn"); }
      return show();
    }
    state[s] = "booked"; done.push(s); log.add(`${s}: booked (local commit, visible to others now)`, "ok");
  }
  log.add("saga complete", "ok");
  show();
}
book();

K.section("Transactional outbox");
const crashP = K.slider("Relay crash % per publish", 0, 60, 20, 5);
K.button("Place 5 orders", () => { for (let i = 0; i < 5; i++) { const id = ++oid; orders.push(id); outbox.push({ id, sent: false }); } render(); }, "primary");
K.button("Run relay", relay);
const ost = K.stats({ orders: "Orders in DB", outbox: "Outbox unsent", published: "Broker messages", unique: "Unique events", dup: "Duplicates (consumer dedupes)" });
const olog = K.log(90);
let oid = 0;
const orders = [], outbox = [], broker = [];
function relay() {
  for (const row of outbox.filter((r) => !r.sent)) {
    broker.push(row.id);                                             // publish first…
    if (Math.random() * 100 < crashP.value) { olog.add(`relay crashed after publishing order ${row.id} but before marking it sent`, "bad"); return render(); }
    row.sent = true;                                                 // …then mark sent
  }
  olog.add("relay drained the outbox", "ok"); render();
}
function render() {
  const uniq = new Set(broker).size;
  ost.setAll({ orders: orders.length, outbox: outbox.filter((r) => !r.sent).length, published: broker.length, unique: uniq });
  ost.set("dup", broker.length - uniq, broker.length > uniq ? "warn" : "ok");
}
render();
olog.add("The order row and its outbox row commit in ONE local transaction, so no event is ever lost; crashes only cause duplicates.", "muted");
