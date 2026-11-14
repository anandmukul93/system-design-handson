// The two application versions that run against the table while it changes. Same contract:
//   (db) -> nothing; throws if the schema no longer fits what this version expects.
import { columnsOf } from "./database.js";

// v1 was written before the migration: it only knows the column `name`.
export function appV1(db) {
  db.run("INSERT INTO users(name) VALUES ('v1 user')");
  db.exec("SELECT name FROM users LIMIT 1");
}

// v2 is written to survive the whole migration: it writes both columns while both exist,
// and reads the new one, falling back to the old.
export function appV2(db) {
  if (columnsOf(db).includes("name")) {
    db.run("INSERT INTO users(name, full_name) VALUES ('v2 user', 'v2 user')");
    db.exec("SELECT COALESCE(full_name, name) FROM users LIMIT 1");
  } else {
    db.run("INSERT INTO users(full_name) VALUES ('v2 user')");
    db.exec("SELECT full_name FROM users LIMIT 1");
  }
}
