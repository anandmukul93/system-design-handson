// Expand/contract migration on real SQLite while old and new app versions keep running; plus upcasting. Edit me and press Run.
K.title(
  "Schema evolution",
  "Rename users.name → users.full_name with old and new app versions live. Try the unsafe one-step rename first.",
);

const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
let db,
  stepIdx = 0,
  oldOk = 0,
  oldErr = 0,
  newOk = 0,
  newErr = 0,
  newLive = false,
  oldLive = true;
const STEPS = [
  ["1. Expand: add column full_name (nullable)", "ALTER TABLE users ADD COLUMN full_name TEXT"],
  ["2. Deploy app v2: writes BOTH columns, reads full_name ?? name", null, () => (newLive = true)],
  ["3. Backfill full_name in batches", "UPDATE users SET full_name = name WHERE full_name IS NULL"],
  ["4. Retire app v1 (nothing reads name any more)", null, () => (oldLive = false)],
  ["5. Contract: drop column name", "ALTER TABLE users DROP COLUMN name"],
];
K.section("Migration");
K.button(
  "Unsafe: rename in one step",
  () => {
    if (!db) return;
    try {
      db.run("ALTER TABLE users RENAME COLUMN name TO full_name");
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
    if (!db || stepIdx >= STEPS.length) return;
    const [label, sql, fn] = STEPS[stepIdx++];
    try {
      if (sql) db.run(sql);
      if (fn) fn();
      log.add(label, "ok");
    } catch (e) {
      log.add(label + ": " + e.message, "bad");
    }
    plan.set(STEPS.map(([l], i) => (i < stepIdx ? "✓ " : i === stepIdx ? "→ " : "  ") + l).join("\n"));
  },
  "primary",
);
K.button("Reset database", () => setup());
const plan = K.code(STEPS.map(([l]) => "  " + l).join("\n"));
const st = K.stats({ v1: "App v1 ok / errors", v2: "App v2 ok / errors", cols: "Columns" });
const log = K.log(110);

function appV1() {
  try {
    db.run("INSERT INTO users(name) VALUES ('v1 user')");
    db.exec("SELECT name FROM users LIMIT 1");
    oldOk++;
  } catch (e) {
    if (oldErr++ % 10 === 0) log.add("app v1: " + e.message, "bad");
  }
}
function appV2() {
  const cols = db.exec("PRAGMA table_info(users)")[0].values.map((r) => r[1]);
  try {
    if (cols.includes("name")) db.run("INSERT INTO users(name, full_name) VALUES ('v2 user', 'v2 user')");
    else db.run("INSERT INTO users(full_name) VALUES ('v2 user')");
    db.exec(
      cols.includes("name")
        ? "SELECT COALESCE(full_name, name) FROM users LIMIT 1"
        : "SELECT full_name FROM users LIMIT 1",
    );
    newOk++;
  } catch (e) {
    if (newErr++ % 10 === 0) log.add("app v2: " + e.message, "bad");
  }
}
function setup() {
  db = new SQL.Database();
  db.run("CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT)");
  for (let i = 0; i < 20; i++) db.run("INSERT INTO users(name) VALUES (?)", ["user " + i]);
  stepIdx = 0;
  oldOk = oldErr = newOk = newErr = 0;
  newLive = false;
  oldLive = true;
  plan.set(STEPS.map(([l], i) => (i === 0 ? "→ " : "  ") + l).join("\n"));
  log.add("fresh database: users(id, name), app v1 live", "muted");
}
let SQL;
(async () => {
  try {
    await K.loadScript(SQLJS + "sql-wasm.js");
    SQL = await initSqlJs({ locateFile: (f) => SQLJS + f });
    setup();
  } catch (e) {
    log.add("Could not load sql.js (" + e.message + "); the migration panel needs cdn.jsdelivr.net.", "bad");
  }
})();
K.loop(() => {
  if (!db) return;
  if (oldLive) appV1();
  if (newLive) appV2();
  st.set("v1", oldLive ? `${oldOk} / ${oldErr}` : "retired", oldErr ? "bad" : "ok");
  st.set("v2", newLive ? `${newOk} / ${newErr}` : "not deployed", newErr ? "bad" : "ok");
  st.set(
    "cols",
    db
      .exec("PRAGMA table_info(users)")[0]
      .values.map((r) => r[1])
      .join(", "),
  );
}, 400);

K.section("Upcasting old events on read");
const raw = K.textarea(
  '{"schema_version":1,"name":"Ada Lovelace"}\n{"schema_version":2,"first":"Alan","last":"Turing","name":"Alan Turing"}\n{"schema_version":3,"first":"Grace","last":"Hopper"}',
  3,
);
const up = K.code("");
function upcast(e) {
  const steps = [];
  if (e.schema_version === 1) {
    const [first, ...rest] = e.name.split(" ");
    e = { schema_version: 2, first, last: rest.join(" "), name: e.name };
    steps.push("v1→v2: split name");
  }
  if (e.schema_version === 2) {
    const { name, ...r } = e;
    e = { ...r, schema_version: 3 };
    steps.push("v2→v3: drop name");
  }
  return [e, steps];
}
function runUp() {
  try {
    up.set(
      raw.value
        .trim()
        .split("\n")
        .map((l) => {
          const [e, s] = upcast(JSON.parse(l));
          return `${JSON.stringify(e)}   ${s.join(", ") || "already v3"}`;
        })
        .join("\n"),
    );
  } catch (e) {
    up.set("error: " + e.message);
  }
}
raw.el.addEventListener("input", runUp);
runUp();
