// Content-addressed build cache + a dependency resolver that explains conflicts. Edit me and press Run.
K.title("CI/CD and dependencies", "Edit a file and push: each step's cache key is a hash of its inputs. Then edit version ranges and resolve.");

const files = { "package.json": '{"deps": {"web-kit": "^2.0.0"}}', "src/api.js": "export const api = 1;", "src/ui.js": "export const ui = 1;", "docs/README.md": "# Docs" };
const STEPS = [
  { name: "install deps", inputs: ["package.json"] },
  { name: "build api", inputs: ["src/api.js"], after: "install deps" },
  { name: "build ui", inputs: ["src/ui.js"], after: "install deps" },
  { name: "test", inputs: ["src/api.js", "src/ui.js"], after: "build ui" },
  { name: "docs site", inputs: ["docs/README.md"] },
  { name: "image", inputs: ["src/api.js", "src/ui.js", "package.json"], after: "test" },
];
const cache = new Set();
K.section("Pipeline");
const which = K.select("File", Object.keys(files), "src/ui.js", () => (editor.value = files[which.value]));
const editor = K.textarea(files["src/ui.js"], 2);
editor.el.addEventListener("input", () => (files[which.value] = editor.value));
K.button("Push", push, "primary");
const table = K.table(["Step", "Cache key (hash of inputs + upstream key)", "Result", "Time"]);
const st = K.stats({ total: "Pipeline time", saved: "Saved by cache" });
function push() {
  const keys = {}; let total = 0, full = 0;
  const rows = STEPS.map((s) => {
    const key = (K.hash(s.inputs.map((f) => f + files[f]).join("|") + (s.after ? keys[s.after] : "")) >>> 0).toString(16).padStart(8, "0");
    keys[s.name] = key;
    const cost = 20 + (K.hash(s.name) % 60); full += cost;
    const hit = cache.has(s.name + key); if (!hit) { cache.add(s.name + key); total += cost; } else total += 1;
    return [s.name, key, K.chip(hit ? "cache hit" : "rebuilt", hit ? "ok" : "warn"), hit ? "1 s" : cost + " s"];
  });
  table.set(rows); st.setAll({ total: total + " s", saved: Math.round(100 - (100 * total) / full) + "%" });
}
push();

K.section("Dependency resolver");
const REG = { "web-kit": { "2.0.0": { "http-lib": "^1.0.0" }, "2.3.0": { "http-lib": "^1.4.0" }, "3.0.0": { "http-lib": "^2.0.0" } }, "http-lib": { "1.0.0": {}, "1.4.2": {}, "1.9.0": {}, "2.0.0": {}, "2.1.0": {} }, "auth-sdk": { "1.0.0": { "http-lib": "~1.4.0" }, "2.0.0": { "http-lib": "^2.1.0" } } };
K.note("One requirement per line. Try changing auth-sdk to ^2.0.0 to see a conflict explained.");
const reqs = K.textarea('web-kit ^2.0.0\nauth-sdk ^1.0.0', 3);
K.button("Resolve", resolve, "primary");
const lock = K.code("");
const cmp = (a, b) => { const x = a.split(".").map(Number), y = b.split(".").map(Number); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
function sat(v, r) {
  if (r === "*") return true;
  const base = r.replace(/^[\^~]/, ""), [M, m] = base.split(".").map(Number), [vM, vm] = v.split(".").map(Number);
  if (cmp(v, base) < 0) return false;
  if (r[0] === "^") return vM === M;
  if (r[0] === "~") return vM === M && vm === m;
  return cmp(v, base) === 0;
}
function resolve() {
  const top = reqs.value.trim().split("\n").map((l) => l.trim().split(/\s+/)).filter((x) => x[0]);
  const constraints = {};                       // pkg → [{range, from}]
  const add = (p, r, from) => (constraints[p] ??= []).push({ r, from });
  top.forEach(([p, r]) => add(p, r, "your project"));
  const chosen = {};
  for (let round = 0; round < 5; round++) {
    for (const p of Object.keys(constraints)) {
      const vs = Object.keys(REG[p] || {}).sort(cmp).reverse().filter((v) => constraints[p].every((c) => sat(v, c.r)));
      if (!vs.length) return lock.set(`CONFLICT on ${p}: no version satisfies all of\n` + constraints[p].map((c) => `  ${c.r.padEnd(8)} required by ${c.from}`).join("\n") + `\navailable: ${Object.keys(REG[p] || {}).join(", ")}`);
      if (chosen[p] !== vs[0]) { chosen[p] = vs[0]; for (const [d, r] of Object.entries(REG[p][vs[0]])) if (!constraints[d]?.some((c) => c.from === `${p}@${vs[0]}`)) add(d, r, `${p}@${vs[0]}`); }
    }
  }
  lock.set("lockfile:\n" + Object.entries(chosen).map(([p, v]) => `  ${p}@${v}  (integrity sha512-${(K.hash(p + v) >>> 0).toString(36)}…)`).join("\n"));
}
resolve();
