// UI only: four panels. Panels 1-3 run SQL against the database created in seed.js; panel 4 is arithmetic.
import { SQLJS_CDN, CUSTOMERS, ORDERS, createDatabase, timed } from "./seed.js";
import { QUERY, setIndex, queryPlan, rowCount } from "./index_plan.js";
import { loadWithNPlusOne, loadWithJoin } from "./query_loading.js";
import { offsetPage, keysetPage } from "./pagination.js";
import { poolHealth } from "./connection_pool.js";

K.title(
  "Databases in practice",
  "A real SQLite database runs in this page. Toggle an index, count queries, and compare pagination.",
);

let db = null;
const ready = () => db || (log.add("the database is still loading", "warn"), false);

K.section("1. Indexes and the query plan");
const useIndex = K.toggle("Index on orders(customer_id)", false, () => showPlan());
K.code(QUERY);
const planStats = K.stats({ plan: "Plan", rows: "Rows returned", ms: "Time (100 runs)" });
function showPlan() {
  if (!ready()) return;
  setIndex(db, useIndex.value);
  const plan = queryPlan(db);
  const [rows, ms] = timed(() => rowCount(db), 100);
  planStats.set("plan", plan, plan.includes("SCAN") ? "bad" : "ok");
  planStats.setAll({ rows, ms: ms.toFixed(1) + " ms" });
}

K.section("2. N+1 vs JOIN");
K.button("Load 50 customers with their orders: N+1", () => showLoading(loadWithNPlusOne));
K.button("Same with one JOIN", () => showLoading(loadWithJoin), "primary");
const loadStats = K.stats({ queries: "Queries", ms: "Time" });
function showLoading(variant) {
  if (!ready()) return;
  const [queries, ms] = timed(() => variant(db, 50));
  loadStats.set("queries", queries, queries > 1 ? "bad" : "ok");
  loadStats.set(
    "ms",
    `${ms.toFixed(1)} ms in-process; at ~1 ms of network per query that is +${queries - 1} ms`,
  );
}

K.section("3. Pagination");
const page = K.slider("Page number", 1, 2000, 1500, 1);
K.button("OFFSET page", () => showPage(offsetPage));
K.button("Keyset page", () => showPage(keysetPage), "primary");
const pageStats = K.stats({ how: "Method", walked: "Rows the DB walks", ms: "Time (20 runs)" });
function showPage(variant) {
  if (!ready()) return;
  const { sql, rowsWalked, label } = variant(page.value);
  const [, ms] = timed(() => db.exec(sql), 20);
  pageStats.setAll({ how: label, walked: rowsWalked, ms: ms.toFixed(1) + " ms" });
  log.add(sql, "muted");
}

K.section("4. Connection pool");
const poolSize = K.slider("Pool size", 1, 50, 10, 1, () => showPool());
const rps = K.slider("Requests / s", 10, 2000, 400, 10, () => showPool());
const queryMs = K.slider("Query time (ms)", 1, 100, 20, 1, () => showPool());
const poolStats = K.stats({ util: "Pool utilisation", wait: "Queue wait (approx)", verdict: "Verdict" });
const log = K.log(70);
function showPool() {
  const h = poolHealth({ poolSize: poolSize.value, requestsPerSecond: rps.value, queryMs: queryMs.value });
  const level = h.utilisation >= 1 ? "bad" : h.utilisation > 0.85 ? "warn" : "ok";
  poolStats.set("util", (100 * Math.min(h.utilisation, 9.99)).toFixed(0) + "%", level);
  poolStats.set("wait", isFinite(h.waitMs) ? h.waitMs.toFixed(1) + " ms" : "unbounded");
  poolStats.set("verdict", h.verdict, level);
}
showPool();

(async () => {
  log.add("loading SQLite (wasm)…", "muted");
  try {
    await K.loadScript(SQLJS_CDN + "sql-wasm.js");
    db = createDatabase(await initSqlJs({ locateFile: (file) => SQLJS_CDN + file }));
    log.add(`SQLite ready: ${K.fmt(CUSTOMERS)} customers, ${K.fmt(ORDERS)} orders`, "ok");
    showPlan();
  } catch (e) {
    log.add(
      `Could not load sql.js (${e.message}). Panels 1-3 need network access to cdn.jsdelivr.net.`,
      "bad",
    );
  }
})();
