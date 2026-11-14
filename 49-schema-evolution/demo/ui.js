// UI only: steps the migration while both app versions keep calling the database, and shows upcasting.
import { SQLJS_CDN, createDatabase, columnsOf } from "./database.js";
import { appV1, appV2 } from "./app_versions.js";
import { UNSAFE_RENAME, EXPAND_CONTRACT_STEPS, runStep, progressText } from "./migration.js";
import { upcast } from "./upcast.js";

K.title(
  "Schema evolution",
  "Rename users.name → users.full_name with old and new app versions live. Try the unsafe one-step rename first.",
);

let SQL = null; // the sql.js module, once loaded
let db = null;
let live, stepsDone, counts;

K.section("Migration");
K.button(
  "Unsafe: rename in one step",
  () => {
    if (!db) return;
    try {
      db.run(UNSAFE_RENAME);
      log.add("renamed in one step. v1 is still deployed…", "bad");
    } catch (e) {
      log.add(e.message, "bad");
    }
  },
  "danger",
);
K.button(
  "Safe: next step",
  () => {
    if (!db || stepsDone >= EXPAND_CONTRACT_STEPS.length) return;
    const step = EXPAND_CONTRACT_STEPS[stepsDone++];
    try {
      runStep(step, db, live);
      log.add(step.label, "ok");
    } catch (e) {
      log.add(`${step.label}: ${e.message}`, "bad");
    }
    planOut.set(progressText(EXPAND_CONTRACT_STEPS, stepsDone));
  },
  "primary",
);
K.button("Reset database", () => SQL && reset());
const planOut = K.code(progressText(EXPAND_CONTRACT_STEPS, 0));
const st = K.stats({ v1: "App v1 ok / errors", v2: "App v2 ok / errors", cols: "Columns" });
const log = K.log(110);

function reset() {
  db = createDatabase(SQL);
  live = { v1: true, v2: false };
  stepsDone = 0;
  counts = { v1: { ok: 0, errors: 0 }, v2: { ok: 0, errors: 0 } };
  planOut.set(progressText(EXPAND_CONTRACT_STEPS, 0));
  log.add("fresh database: users(id, name), app v1 live", "muted");
}
function runApp(version, app) {
  try {
    app(db);
    counts[version].ok++;
  } catch (e) {
    if (counts[version].errors++ % 10 === 0) log.add(`app ${version}: ${e.message}`, "bad");
  }
}
K.loop(() => {
  if (!db) return;
  if (live.v1) runApp("v1", appV1);
  if (live.v2) runApp("v2", appV2);
  const show = (c) => `${c.ok} / ${c.errors}`;
  st.set("v1", live.v1 ? show(counts.v1) : "retired", counts.v1.errors ? "bad" : "ok");
  st.set("v2", live.v2 ? show(counts.v2) : "not deployed", counts.v2.errors ? "bad" : "ok");
  st.set("cols", columnsOf(db).join(", "));
}, 400);

(async () => {
  try {
    await K.loadScript(SQLJS_CDN + "sql-wasm.js");
    SQL = await initSqlJs({ locateFile: (file) => SQLJS_CDN + file });
    reset();
  } catch (e) {
    log.add(`Could not load sql.js (${e.message}); the migration panel needs cdn.jsdelivr.net.`, "bad");
  }
})();

K.section("Upcasting old events on read");
const stored = K.textarea(
  '{"schema_version":1,"name":"Ada Lovelace"}\n{"schema_version":2,"first":"Alan","last":"Turing","name":"Alan Turing"}\n{"schema_version":3,"first":"Grace","last":"Hopper"}',
  3,
  () => showUpcast(),
);
const upcastOut = K.code("");
function showUpcast() {
  try {
    const lines = stored.value.trim().split("\n");
    upcastOut.set(
      lines
        .map((line) => {
          const { event, notes } = upcast(JSON.parse(line));
          return `${JSON.stringify(event)}   ${notes.join(", ") || "already v3"}`;
        })
        .join("\n"),
    );
  } catch (e) {
    upcastOut.set("error: " + e.message);
  }
}
showUpcast();
