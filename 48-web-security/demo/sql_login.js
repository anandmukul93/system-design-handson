// SQL injection on a real SQLite database. Two variants of the login query, same contract:
//   (db, username, password) -> { query, params?, user: name | null }
export const SQLJS_CDN = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";

export function createUserDatabase(SQL) {
  const db = new SQL.Database();
  db.run(
    "CREATE TABLE users(name TEXT, password TEXT); INSERT INTO users VALUES ('admin','s3cret'),('ana','pw1');",
  );
  return db;
}

// Variant 1, vulnerable: user input is pasted into the SQL text, so input can change the query itself.
// Username  admin' --  turns the rest of the statement, including the password check, into a comment.
export function loginByConcatenation(db, username, password) {
  const query = `SELECT name FROM users WHERE name = '${username}' AND password = '${password}'`;
  const rows = db.exec(query)[0]?.values || [];
  return { query, user: rows.length ? rows[0][0] : null };
}

// Variant 2, safe: the query text is fixed and input travels separately as parameters. It is only ever data.
export function loginWithParameters(db, username, password) {
  const query = "SELECT name FROM users WHERE name = ? AND password = ?";
  const statement = db.prepare(query);
  statement.bind([username, password]);
  const user = statement.step() ? statement.get()[0] : null;
  statement.free();
  return { query, params: [username, password], user };
}
