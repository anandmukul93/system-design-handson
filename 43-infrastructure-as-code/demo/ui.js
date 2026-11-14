// UI only: a JSON editor for the desired state, the plan output, and a template playground.
import { initialState } from "./resources.js";
import { plan, formatPlan } from "./plan.js";
import { apply } from "./apply.js";
import { parseValues, render } from "./template.js";

K.title(
  "Infrastructure as code",
  "Edit the desired resources (JSON). The plan diffs them against current state; apply makes it real.",
);

let state = initialState();
const example = initialState();
example.web.count = 3; // in-place update
example.db.engine = "postgres16"; // forces replacement
example.cache = { type: "redis", subnet: "subnet_a", size: "small" }; // new resource

K.section("Desired state");
const desired = K.textarea(JSON.stringify(example, null, 2), 16, () => showPlan());
K.button("Apply", applyPlan, "primary");
K.button("Reset current state", () => {
  state = initialState();
  log.add("state reset to the original 4 resources", "muted");
  showPlan();
});
const st = K.stats({
  create: "Create",
  update: "Update in place",
  replace: "Replace (destroy + create)",
  delete: "Delete",
});
const planOut = K.code("");
const log = K.log(70);

// returns the planned actions, or null if the JSON does not parse
function showPlan() {
  let wanted;
  try {
    wanted = JSON.parse(desired.value);
  } catch (e) {
    planOut.set("JSON error: " + e.message);
    return null;
  }
  const actions = plan(state, wanted);
  planOut.set(formatPlan(actions));
  const count = (action) => actions.filter((a) => a.action === action).length;
  st.setAll({ create: count("create"), update: count("update"), delete: count("delete") });
  st.set("replace", count("replace"), count("replace") ? "warn" : null);
  return actions;
}
function applyPlan() {
  const actions = showPlan();
  if (!actions) return;
  apply(state, actions);
  for (const a of actions)
    log.add(`${a.action} ${a.name}`, a.action === "delete" || a.action === "replace" ? "warn" : "ok");
  showPlan();
}
showPlan();

K.section("Template rendering (Helm-style)");
const values = K.textarea("replicas: 3\nimage: shop/web\ntag: 1.4.2\nenv: prod", 4, () => showTemplate());
const template = K.textarea(
  "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web-{{ .env }}\nspec:\n  replicas: {{ .replicas }}\n  template:\n    spec:\n      containers:\n        - image: {{ .image }}:{{ .tag }}",
  10,
  () => showTemplate(),
);
const rendered = K.code("");
function showTemplate() {
  rendered.set(render(template.value, parseValues(values.value)));
}
showTemplate();
