// Creates the demo database: 2,000 customers and 40,000 orders in a real SQLite (sql.js, compiled to wasm).
export const SQLJS_CDN = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
export const CUSTOMERS = 2000;
export const ORDERS = 40000;

// SQL is the module returned by initSqlJs()
export function createDatabase(SQL) {
  const db = new SQL.Database();
  db.run(`CREATE TABLE customers(id INTEGER PRIMARY KEY, name TEXT);
          CREATE TABLE orders(id INTEGER PRIMARY KEY, customer_id INT, total REAL);`);
  db.run("BEGIN");
  const customer = db.prepare("INSERT INTO customers VALUES (?, ?)");
  for (let i = 1; i <= CUSTOMERS; i++) customer.run([i, "c" + i]);
  customer.free();
  const order = db.prepare("INSERT INTO orders VALUES (?, ?, ?)");
  for (let i = 1; i <= ORDERS; i++) order.run([i, 1 + ((i * 7919) % CUSTOMERS), i % 500]);
  order.free();
  db.run("COMMIT");
  return db;
}

// run fn `times` times; returns [last result, elapsed ms]
export function timed(fn, times = 1) {
  const started = performance.now();
  let result;
  for (let i = 0; i < times; i++) result = fn();
  return [result, performance.now() - started];
}
