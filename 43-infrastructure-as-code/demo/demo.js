// Desired state → plan → apply, in dependency order; plus a tiny Helm-style template. Edit me and press Run.
K.title(
  "Infrastructure as code",
  "Edit the desired resources (JSON). The plan diffs them against current state; apply makes it real.",
);

let state = {
  vpc: { type: "vpc", cidr: "10.0.0.0/16" },
  subnet_a: { type: "subnet", vpc: "vpc", cidr: "10.0.1.0/24" },
  db: { type: "database", subnet: "subnet_a", size: "small", engine: "postgres15" },
  web: { type: "instance", subnet: "subnet_a", size: "t3.small", count: 2 },
};
const INITIAL = JSON.stringify(state);
const REPLACE_ON = { database: ["engine"], subnet: ["cidr", "vpc"], vpc: ["cidr"], instance: ["subnet"] };
const deps = (r) => ["vpc", "subnet"].map((k) => r[k]).filter(Boolean);
K.section("Desired state");
const desired = K.textarea(
  JSON.stringify(
    {
      ...state,
      web: { ...state.web, count: 3 },
      db: { ...state.db, engine: "postgres16" },
      cache: { type: "redis", subnet: "subnet_a", size: "small" },
    },
    null,
    2,
  ),
  16,
);
desired.el.addEventListener("input", () => plan());
K.button("Apply", apply, "primary");
K.button("Reset current state", () => {
  state = JSON.parse(INITIAL);
  log.add("state reset to the original 4 resources", "muted");
  plan();
});
const st = K.stats({
  create: "Create",
  update: "Update in place",
  replace: "Replace (destroy + create)",
  del: "Delete",
});
const out = K.code("");
const log = K.log(70);
let actions = [];
function topo(res, reverse) {
  const order = [],
    seen = new Set();
  const visit = (k) => {
    if (seen.has(k) || !res[k]) return;
    seen.add(k);
    deps(res[k]).forEach(visit);
    order.push(k);
  };
  Object.keys(res).forEach(visit);
  return reverse ? order.reverse() : order;
}
function plan() {
  let want;
  try {
    want = JSON.parse(desired.value);
  } catch (e) {
    out.set("JSON error: " + e.message);
    return false;
  }
  actions = [];
  for (const k of topo(want)) {
    const cur = state[k],
      w = want[k];
    if (!cur) {
      actions.push(["create", k, w]);
      continue;
    }
    const changed = Object.keys({ ...cur, ...w }).filter(
      (f) => JSON.stringify(cur[f]) !== JSON.stringify(w[f]),
    );
    if (!changed.length) continue;
    const rep = changed.some((f) => (REPLACE_ON[w.type] || []).includes(f));
    actions.push([rep ? "replace" : "update", k, w, changed]);
  }
  for (const k of topo(state, true)) if (!want[k]) actions.push(["delete", k]); // delete dependents first
  const sym = { create: "+", update: "~", replace: "-/+", delete: "-" };
  out.set(
    actions.length
      ? actions
          .map(
            ([a, k, , ch]) =>
              `${sym[a].padEnd(3)} ${k}${ch ? "  (" + ch.join(", ") + ")" : ""}${a === "replace" ? "  # forces replacement" : ""}`,
          )
          .join("\n")
      : "No changes. Infrastructure matches the configuration.",
  );
  const c = (a) => actions.filter((x) => x[0] === a).length;
  st.setAll({ create: c("create"), update: c("update"), del: c("delete") });
  st.set("replace", c("replace"), c("replace") ? "warn" : null);
  return true;
}
function apply() {
  if (!plan()) return;
  for (const [a, k, w] of actions) {
    if (a === "delete") delete state[k];
    else state[k] = JSON.parse(JSON.stringify(w));
    log.add(`${a} ${k}`, a === "delete" || a === "replace" ? "warn" : "ok");
  }
  plan();
}
plan();

K.section("Template rendering (Helm-style)");
const values = K.textarea("replicas: 3\nimage: shop/web\ntag: 1.4.2\nenv: prod", 4);
const tpl = K.textarea(
  "apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: web-{{ .env }}\nspec:\n  replicas: {{ .replicas }}\n  template:\n    spec:\n      containers:\n        - image: {{ .image }}:{{ .tag }}",
  10,
);
const rendered = K.code("");
function render() {
  const v = Object.fromEntries(
    values.value
      .split("\n")
      .map((l) => l.split(":").map((s) => s.trim()))
      .filter((x) => x[0]),
  );
  rendered.set(
    tpl.value.replace(/\{\{\s*\.(\w+)\s*\}\}/g, (_, k) => (k in v ? v[k] : `<missing value: ${k}>`)),
  );
}
values.el.addEventListener("input", render);
tpl.el.addEventListener("input", render);
render();
