// Loading customers with their orders, two variants. Same contract: (db, customerCount) -> queries sent.
// Variant 1, N+1: one query for the customers, then one more per customer. What a lazy ORM does in a loop.
export function loadWithNPlusOne(db, customerCount) {
  const customers = db.exec(`SELECT id FROM customers WHERE id <= ${customerCount}`)[0].values;
  let queries = 1;
  const orders = db.prepare("SELECT id FROM orders WHERE customer_id = ?");
  for (const [id] of customers) {
    orders.bind([id]);
    while (orders.step());
    orders.reset();
    queries++;
  }
  orders.free();
  return queries;
}
// Variant 2, JOIN: the database does the matching in a single round trip.
export function loadWithJoin(db, customerCount) {
  db.exec(
    `SELECT c.id, o.id FROM customers c JOIN orders o ON o.customer_id = c.id WHERE c.id <= ${customerCount}`,
  );
  return 1;
}
