// UI only: one button per action, the incident clock, the postmortem editor and the rotation table.
import { ACTIONS, Incident } from "./incident.js";
import { draftPostmortem } from "./postmortem.js";
import { buildRotation, parseOverrides } from "./rotation.js";

K.title(
  "Incident response and on-call",
  "A bad deploy is hurting users. Pick actions against the clock; the timeline becomes your postmortem.",
);

let incident = null;
let clock = null;

K.section("Incident");
K.button("Start incident", start, "primary");
for (const [key, action] of Object.entries(ACTIONS)) K.button(action.label, () => act(key));
const st = K.stats({
  clock: "Minutes since impact",
  affected: "Users affected",
  mttd: "MTTD",
  mtta: "MTTA",
  mttr: "MTTR",
});
const log = K.log(120);
K.section("Postmortem draft (editable)");
const postmortem = K.textarea("Resolve the incident to draft a postmortem.", 10);

function start() {
  incident = new Incident();
  log.clear();
  log.add("14:02 deploy 7f3a reaches 100% of checkout-api", "muted");
  if (clock) clock.stop();
  clock = K.loop(() => {
    show(incident.minutePasses());
  }, 700);
}
function act(key) {
  if (!incident) return log.add("press Start incident first", "muted");
  show(incident.act(key));
  if (incident.resolved) {
    clock.stop();
    postmortem.value = draftPostmortem(incident);
  }
}
function show(events) {
  for (const e of events) log.add(e.text, e.kind);
  const { mttd, mtta, mttr } = incident.metrics;
  const minutes = (value) => (value === null ? "–" : value + " min");
  st.setAll({
    clock: incident.minute,
    affected: incident.usersAffected.toLocaleString(),
    mttd: minutes(mttd),
    mtta: minutes(mtta),
    mttr: minutes(mttr),
  });
}

K.section("On-call rotation");
const people = K.text("Engineers", "ana, ben, chen, dev, eve", () => showRotation(), 260);
const overrides = K.text("Override (week:name)", "3:eve", () => showRotation(), 120);
const rotationOut = K.code("");
function showRotation() {
  const names = people.value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!names.length) return rotationOut.set("add people");
  const { weeks, primaryWeeks } = buildRotation(
    names,
    parseOverrides(overrides.value),
    10,
    new Date("2026-11-16"),
  );
  const rows = weeks.map((w) => {
    const date = w.starts.toISOString().slice(5, 10);
    const note = w.overridden ? "  (override)" : "";
    return `week ${String(w.week).padStart(2)} (${date})  primary ${w.primary.padEnd(6)} secondary ${w.secondary}${note}`;
  });
  const fairness = Object.entries(primaryWeeks)
    .map(([name, count]) => `${name} ${count}`)
    .join(", ");
  rotationOut.set(`${rows.join("\n")}\n\nprimary weeks: ${fairness}`);
}
showRotation();
