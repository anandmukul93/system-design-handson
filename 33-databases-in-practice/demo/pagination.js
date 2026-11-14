// Pagination, two variants. Same contract: (page, pageSize) -> { sql, rowsWalked, label }.
// Variant 1, OFFSET: the database walks and throws away every row before the page.
export function offsetPage(page, pageSize = 10) {
  const offset = (page - 1) * pageSize;
  return {
    sql: `SELECT id FROM orders ORDER BY id LIMIT ${pageSize} OFFSET ${offset}`,
    rowsWalked: offset + pageSize,
    label: "OFFSET " + offset,
  };
}
// Variant 2, keyset: remember the last id of the previous page and seek straight to it through the index.
export function keysetPage(page, pageSize = 10) {
  const lastSeenId = (page - 1) * pageSize; // ids are dense 1..N here, so the previous page ended at this id
  return {
    sql: `SELECT id FROM orders WHERE id > ${lastSeenId} ORDER BY id LIMIT ${pageSize}`,
    rowsWalked: pageSize,
    label: "WHERE id > last_seen",
  };
}
