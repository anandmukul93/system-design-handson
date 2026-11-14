// Real SQLite in the browser (sql.js): indexes and query plans, N+1 vs JOIN, OFFSET vs keyset, pool sizing. Edit me and press Run.
K.title(
  "Databases in practice",
  "A real SQLite database runs in this page. Toggle an index, count queries, and compare pagination.",
);

const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
let db;
K.section("1. Indexes and the query plan");
const idx = K.toggle("Index on orders(customer_id)", false, () => plan());
const qry = K.code("SELECT * FROM orders WHERE customer_id = 42");
const pst = K.stats({ plan: "Plan", rows: "Rows returned", ms: "Time (100 runs)" });
K.section("2. N+1 vs JOIN");
K.button("Load 50 customers with their orders: N+1", () => nPlus1(false));
K.button("Same with one JOIN", () => nPlus1(true), "primary");
const nst = K.stats({ q: "Queries", ms: "Time" });
K.section("3. Pagination");
const page = K.slider("Page number", 1, 2000, 1500, 1);
K.button("OFFSET page", () => paginate(false));
K.button("Keyset page", () => paginate(true), "primary");
const gst = K.stats({ how: "Method", scanned: "Rows the DB walks", ms: "Time (20 runs)" });
K.section("4. Connection pool");
const pool = K.slider("Pool size", 1, 50, 10, 1);
const qps = K.slider("Requests / s", 10, 2000, 400, 10);
const qms = K.slider("Query time (ms)", 1, 100, 20, 1);
const cst = K.stats({ util: "Pool utilisation", wait: "Queue wait (approx)", verdict: "Verdict" });
const log = K.log(70);

function time(fn, n) {
  const t = performance.now();
  let r;
  for (let i = 0; i < n; i++) r = fn();
  return [r, performance.now() - t];
}
function plan() {
  if (!db) return;
  db.run(
    idx.value ? "CREATE INDEX IF NOT EXISTS ix_cust ON orders(customer_id)" : "DROP INDEX IF EXISTS ix_cust",
  );
  const p = db
    .exec("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE customer_id = 42")[0]
    .values.map((r) => r[3])
    .join("; ");
  const [rows, ms] = time(
    () => db.exec("SELECT * FROM orders WHERE customer_id = 42")[0]?.values.length || 0,
    100,
  );
  pst.set("plan", p, p.includes("SCAN") ? "bad" : "ok");
  pst.setAll({ rows, ms: ms.toFixed(1) + " ms" });
}
function nPlus1(join) {
  const [q, ms] = time(() => {
    if (join) {
      db.exec("SELECT c.id, o.id FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.id <= 50");
      return 1;
    }
    const cs = db.exec("SELECT id FROM customers WHERE id <= 50")[0].values;
    let n = 1;
    const st = db.prepare("SELECT id FROM orders WHERE customer_id = ?");
    for (const [id] of cs) {
      st.bind([id]);
      while (st.step());
      st.reset();
      n++;
    }
    st.free();
    return n;
  }, 1);
  nst.set("q", q, q > 1 ? "bad" : "ok");
  nst.set(
    "ms",
    ms.toFixed(1) + " ms (in-process; add ~1 ms network per query in real life → +" + (q - 1) + " ms)",
  );
}
function paginate(keyset) {
  const off = (page.value - 1) * 10;
  const lastId = off; // ids are dense 1..N here, so the previous page ended at id = off
  const sql = keyset
    ? `SELECT id FROM orders WHERE id > ${lastId} ORDER BY id LIMIT 10`
    : `SELECT id FROM orders ORDER BY id LIMIT 10 OFFSET ${off}`;
  const [, ms] = time(() => db.exec(sql), 20);
  gst.setAll({
    how: keyset ? "WHERE id > last_seen" : "OFFSET " + off,
    scanned: keyset ? 10 : off + 10,
    ms: ms.toFixed(1) + " ms",
  });
  log.add(sql, "muted");
}
function poolCalc() {
  const busy = (qps.value * qms.value) / 1000,
    u = busy / pool.value; // Little's law: L = λW
  const wait = u >= 1 ? Infinity : (qms.value * u) / (1 - u) / pool.value;
  cst.set("util", (100 * Math.min(u, 9.99)).toFixed(0) + "%", u > 0.85 ? "bad" : "ok");
  cst.set("wait", isFinite(wait) ? wait.toFixed(1) + " ms" : "unbounded");
  cst.set(
    "verdict",
    u >= 1
      ? "queue grows forever: add connections or speed up queries"
      : u > 0.85
        ? "near saturation"
        : "healthy",
    u >= 1 ? "bad" : u > 0.85 ? "warn" : "ok",
  );
}
[pool, qps, qms].forEach((s) => s.el.addEventListener("input", poolCalc));
poolCalc();

(async () => {
  log.add("loading SQLite (wasm)…", "muted");
  try {
    await K.loadScript(SQLJS + "sql-wasm.js");
    const SQL = await initSqlJs({ locateFile: (f) => SQLJS + f });
    db = new SQL.Database();
    db.run(
      "CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT); CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INT, total REAL);",
    );
    db.run("BEGIN");
    const c = db.prepare("INSERT INTO customers VALUES (?, ?)");
    for (let i = 1; i <= 2000; i++) c.run([i, "c" + i]);
    c.free();
    const o = db.prepare("INSERT INTO orders VALUES (?, ?, ?)");
    for (let i = 1; i <= 40000; i++) o.run([i, 1 + ((i * 7919) % 2000), i % 500]);
    o.free();
    db.run("COMMIT");
    log.add("SQLite ready: 2,000 customers, 40,000 orders", "ok");
    plan();
  } catch (e) {
    log.add(
      "Could not load sql.js (" + e.message + "). Panels 1-3 need network access to cdn.jsdelivr.net.",
      "bad",
    );
  }
})();
