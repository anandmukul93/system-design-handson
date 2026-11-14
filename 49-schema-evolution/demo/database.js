// The starting point: a real SQLite table users(id, name) with 20 rows. The goal is to rename name → full_name.
export const SQLJS_CDN = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";

export function createDatabase(SQL) {
  const db = new SQL.Database();
  db.run("CREATE TABLE users(id INTEGER PRIMARY KEY, name TEXT)");
  for (let i = 0; i < 20; i++) db.run("INSERT INTO users(name) VALUES (?)", ["user " + i]);
  return db;
}

export function columnsOf(db, table = "users") {
  return db.exec(`PRAGMA table_info(${table})`)[0].values.map((row) => row[1]);
}
