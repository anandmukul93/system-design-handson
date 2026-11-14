// UI only: runs the chosen protocol, shows each service's final state, and drives the outbox relay.
import { twoPhaseCommit } from "./two_phase_commit.js";
import { saga } from "./saga.js";
import { OrderService, runRelay } from "./outbox.js";

K.title(
  "Distributed transactions",
  "Book flight + hotel + car. Make one service fail and compare two-phase commit with a saga. Then crash the outbox relay.",
);

const SERVICES = ["flight", "hotel", "car"];
const PROTOCOLS = { "2PC": twoPhaseCommit, "saga (orchestrated)": saga };

K.section("Trip booking");
const failing = K.select("Failing service", ["none", ...SERVICES], "car");
const protocol = K.select("Protocol", Object.keys(PROTOCOLS), "saga (orchestrated)");
const coordinatorCrash = K.toggle("2PC: coordinator crashes after PREPARE", false);
K.button("Book trip", book, "primary");
const table = K.table(["Service", "State"]);
const log = K.log(150);

function stateColor(state) {
  if (/commit|booked/.test(state)) return "ok";
  if (/abort|cancel/.test(state)) return "warn";
  if (/lock|prepared/.test(state)) return "c5";
  return "muted";
}
function book() {
  const run = PROTOCOLS[protocol.value];
  const { states, steps } = run(SERVICES, failing.value, { coordinatorCrashes: coordinatorCrash.value });
  log.clear();
  for (const s of steps) log.add(s.text, s.kind);
  table.set(SERVICES.map((s) => [s, K.chip(states[s], stateColor(states[s]))]));
}
book();

K.section("Transactional outbox");
const service = new OrderService();
const broker = []; // order ids, in the order they were published
const crashPercent = K.slider("Relay crash % per publish", 0, 60, 20, 5);
K.button(
  "Place 5 orders",
  () => {
    for (let i = 0; i < 5; i++) service.placeOrder();
    render();
  },
  "primary",
);
K.button("Run relay", () => {
  const { crashedAfter } = runRelay(service, broker, crashPercent.value, Math.random);
  if (crashedAfter === null) outboxLog.add("relay drained the outbox", "ok");
  else
    outboxLog.add(`relay crashed after publishing order ${crashedAfter} but before marking it sent`, "bad");
  render();
});
const st = K.stats({
  orders: "Orders in DB",
  outbox: "Outbox unsent",
  published: "Broker messages",
  unique: "Unique events",
  duplicates: "Duplicates (consumer dedupes)",
});
const outboxLog = K.log(90);
function render() {
  const unique = new Set(broker).size;
  st.setAll({
    orders: service.orders.length,
    outbox: service.unsent().length,
    published: broker.length,
    unique,
  });
  st.set("duplicates", broker.length - unique, broker.length > unique ? "warn" : "ok");
}
render();
outboxLog.add(
  "The order row and its outbox row commit in ONE local transaction, so no event is ever lost; crashes only cause duplicates.",
  "muted",
);
