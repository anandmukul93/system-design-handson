// UI only: edit a file and push to see which steps rebuild; edit version ranges and resolve.
import { STEPS, sampleRepo } from "./pipeline.js";
import { runPipeline } from "./build_cache.js";
import { REGISTRY } from "./registry.js";
import { resolve, parseRequirements } from "./resolver.js";

K.title(
  "CI/CD and dependencies",
  "Edit a file and push: each step's cache key is a hash of its inputs. Then edit version ranges and resolve.",
);

K.section("Pipeline");
const files = sampleRepo();
const cache = new Set();
const which = K.select("File", Object.keys(files), "src/ui.js", () => (editor.value = files[which.value]));
const editor = K.textarea(files["src/ui.js"], 2, (text) => (files[which.value] = text));
K.button("Push", push, "primary");
const table = K.table(["Step", "Cache key (hash of inputs + upstream key)", "Result", "Time"]);
const st = K.stats({ total: "Pipeline time", saved: "Saved by cache" });
function push() {
  const run = runPipeline(STEPS, files, cache, K.hash);
  table.set(
    run.steps.map((s) => [
      s.name,
      s.key,
      K.chip(s.hit ? "cache hit" : "rebuilt", s.hit ? "ok" : "warn"),
      s.seconds + " s",
    ]),
  );
  const savedPercent = Math.round(100 - (100 * run.totalSeconds) / run.uncachedSeconds);
  st.setAll({ total: run.totalSeconds + " s", saved: savedPercent + "%" });
}
push();

K.section("Dependency resolver");
K.note("One requirement per line. Try changing auth-sdk to ^2.0.0 to see a conflict explained.");
const requirements = K.textarea("web-kit ^2.0.0\nauth-sdk ^1.0.0", 3);
K.button("Resolve", showResolution, "primary");
const lockfile = K.code("");
function showResolution() {
  const { chosen, conflict } = resolve(parseRequirements(requirements.value), REGISTRY);
  if (conflict) {
    const lines = conflict.constraints.map((c) => `  ${c.range.padEnd(8)} required by ${c.from}`);
    const available = conflict.available.join(", ") || "(unknown package)";
    return lockfile.set(
      `CONFLICT on ${conflict.package}: no version satisfies all of\n${lines.join("\n")}\navailable: ${available}`,
    );
  }
  const entries = Object.entries(chosen).map(
    ([name, version]) =>
      `  ${name}@${version}  (integrity sha512-${(K.hash(name + version) >>> 0).toString(36)}…)`,
  );
  lockfile.set("lockfile:\n" + entries.join("\n"));
}
showResolution();
