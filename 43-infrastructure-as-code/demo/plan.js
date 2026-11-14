// Plan: diff desired configuration against current state. Nothing is changed here.
// returns [{ action: "create" | "update" | "replace" | "delete", name, resource?, changedFields? }]
import { FORCES_REPLACEMENT } from "./resources.js";
import { creationOrder, deletionOrder } from "./dependency_order.js";

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function plan(current, desired) {
  const actions = [];
  for (const name of creationOrder(desired)) {
    const have = current[name];
    const want = desired[name];
    if (!have) {
      actions.push({ action: "create", name, resource: want });
      continue;
    }
    const changedFields = Object.keys({ ...have, ...want }).filter(
      (field) => !same(have[field], want[field]),
    );
    if (!changedFields.length) continue;
    const mustReplace = changedFields.some((field) => (FORCES_REPLACEMENT[want.type] || []).includes(field));
    actions.push({ action: mustReplace ? "replace" : "update", name, resource: want, changedFields });
  }
  for (const name of deletionOrder(current)) if (!desired[name]) actions.push({ action: "delete", name });
  return actions;
}

const SYMBOL = { create: "+", update: "~", replace: "-/+", delete: "-" };

// the familiar "terraform plan" text
export function formatPlan(actions) {
  if (!actions.length) return "No changes. Infrastructure matches the configuration.";
  return actions
    .map((a) => {
      const fields = a.changedFields ? `  (${a.changedFields.join(", ")})` : "";
      return `${SYMBOL[a.action].padEnd(3)} ${a.name}${fields}${a.action === "replace" ? "  # forces replacement" : ""}`;
    })
    .join("\n");
}
