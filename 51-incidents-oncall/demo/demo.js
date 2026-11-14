// Incident simulator with timeline, MTTD/MTTA/MTTR and a postmortem draft; plus a fair on-call rotation. Edit me and press Run.
K.title("Incident response and on-call", "A bad deploy is hurting users. Pick actions against the clock; the timeline becomes your postmortem.");

const ACTIONS = {
  ack: ["Acknowledge the page", 1, "Acknowledged the alert"],
  dash: ["Check dashboards", 3, "Dashboards: error rate jumped at 14:02 on checkout-api, right after deploy 7f3a"],
  logs: ["Search logs by trace id", 4, "Logs: NullPointerException in PriceFormatter (new code path)"],
  rollback: ["Roll back deploy 7f3a", 5, "Rolled back checkout-api to the previous version"],
  failover: ["Fail over the database", 8, "Failed over the DB (did not help: the DB was healthy)"],
  page: ["Page the checkout team", 2, "Paged the checkout owner, who joined as incident commander"],
  status: ["Post a status page update", 1, "Posted status: investigating elevated checkout errors"],
};
let t = 0, started = false, detectedAt = null, ackAt = null, resolvedAt = null, users = 0, timeline = [];
K.section("Incident");
K.button("Start incident", start, "primary");
for (const [k, [label]] of Object.entries(ACTIONS)) K.button(label, () => act(k));
const st = K.stats({ clock: "Minutes since impact", affected: "Users affected", mttd: "MTTD", mtta: "MTTA", mttr: "MTTR" });
const log = K.log(120);
K.section("Postmortem draft (editable)");
const pm = K.textarea("Resolve the incident to draft a postmortem.", 10);
let loop;
function start() {
  t = 0; started = true; detectedAt = ackAt = resolvedAt = null; users = 0; timeline = [["0", "Deploy 7f3a rolled out; errors start"]]; log.clear();
  log.add("14:02 deploy 7f3a reaches 100% of checkout-api", "muted");
  loop && loop.stop();
  loop = K.loop(() => {
    if (resolvedAt !== null) return;
    t++; users += 120;
    if (t === 4) { detectedAt = t; timeline.push([String(t), "Burn-rate alert fires and pages on-call"]); log.add(`+${t} min: PAGE: checkout error budget burning 20x`, "bad"); }
    if (t > 4 && !ackAt && t % 3 === 0) log.add(`+${t} min: page escalates (not acknowledged)`, "warn");
    render();
  }, 700);
}
function act(k) {
  if (!started || resolvedAt !== null) return;
  if (!detectedAt && k !== "status") return log.add("nothing has alerted yet: users are hurting silently", "warn");
  const [, cost, text] = ACTIONS[k];
  t += cost;
  if (k === "ack" && !ackAt) ackAt = t;
  timeline.push([String(t), text]);
  log.add(`+${t} min: ${text}`, k === "failover" ? "warn" : "ok");
  if (k === "rollback") { resolvedAt = t; log.add(`+${t} min: error rate back to baseline. Mitigated.`, "ok"); draft(); }
  render();
}
function render() {
  st.setAll({ clock: t, affected: users.toLocaleString(), mttd: detectedAt ? detectedAt + " min" : "–", mtta: ackAt ? ackAt - detectedAt + " min" : "–", mttr: resolvedAt ? resolvedAt + " min" : "–" });
}
function draft() {
  pm.value = `# Postmortem: checkout errors after deploy 7f3a (blameless)

## Impact
${users.toLocaleString()} users saw checkout failures for ${resolvedAt} minutes.

## Timeline (minutes after impact)
${timeline.map(([m, e]) => `- +${m}: ${e}`).join("\n")}

## Metrics
MTTD ${detectedAt} min · MTTA ${ackAt ? ackAt - detectedAt : "n/a"} min · MTTR ${resolvedAt} min

## Root cause
A new code path in PriceFormatter dereferenced a missing currency field.

## What went well / what went poorly
- ${timeline.some((x) => x[1].startsWith("Rolled back")) ? "Rollback was available and fast" : ""}
- ${timeline.some((x) => x[1].startsWith("Failed over")) ? "We spent time on a DB failover the data did not support" : "We followed the evidence"}

## Action items
- [ ] Canary deploys with automatic rollback on error rate (owner: checkout, due: +2 weeks)
- [ ] Contract test for missing currency field (owner: checkout)
- [ ] Alert on 5-minute burn rate so detection is faster than ${detectedAt} min (owner: SRE)`;
}

K.section("On-call rotation");
const people = K.text("Engineers", "ana, ben, chen, dev, eve", () => rota(), 260);
const override = K.text("Override (week:name)", "3:eve", () => rota(), 120);
const rotaOut = K.code("");
function rota() {
  const ps = people.value.split(",").map((s) => s.trim()).filter(Boolean); if (!ps.length) return rotaOut.set("add people");
  const ov = Object.fromEntries(override.value.split(",").map((x) => x.split(":").map((s) => s.trim())).filter((x) => x[1]));
  const count = {}, start = new Date("2026-11-16");
  const rows = Array.from({ length: 10 }, (_, w) => {
    const primary = ov[w + 1] || ps[w % ps.length], secondary = ps[(w + 1) % ps.length] === primary ? ps[(w + 2) % ps.length] : ps[(w + 1) % ps.length];
    count[primary] = (count[primary] || 0) + 1;
    return `week ${String(w + 1).padStart(2)} (${new Date(start.getTime() + w * 7 * 864e5).toISOString().slice(5, 10)})  primary ${primary.padEnd(6)} secondary ${secondary}${ov[w + 1] ? "  (override)" : ""}`;
  });
  rotaOut.set(rows.join("\n") + "\n\nprimary weeks: " + Object.entries(count).map(([p, c]) => `${p} ${c}`).join(", "));
}
rota();
