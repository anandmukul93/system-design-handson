// Indexes: the same query is a full table SCAN without an index and a SEARCH (B-tree lookup) with one.
export const QUERY = "SELECT * FROM orders WHERE customer_id = 42";

export function setIndex(db, enabled) {
  db.run(
    enabled ? "CREATE INDEX IF NOT EXISTS ix_cust ON orders(customer_id)" : "DROP INDEX IF EXISTS ix_cust",
  );
}
// what SQLite says it will do, e.g. "SCAN orders" or "SEARCH orders USING INDEX ix_cust (customer_id=?)"
export function queryPlan(db, sql = QUERY) {
  return db
    .exec("EXPLAIN QUERY PLAN " + sql)[0]
    .values.map((row) => row[3])
    .join("; ");
}
export function rowCount(db, sql = QUERY) {
  return db.exec(sql)[0]?.values.length || 0;
}
