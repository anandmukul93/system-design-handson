// Two ways to rename a column while the application keeps running.
// A step is { label, sql?, deploy? }, where deploy changes which app versions are live.

// Unsafe: one statement. Correct for the database, but every v1 instance still running breaks at once.
export const UNSAFE_RENAME = "ALTER TABLE users RENAME COLUMN name TO full_name";

// Safe: expand / contract. Every step is compatible with every app version live at that moment.
export const EXPAND_CONTRACT_STEPS = [
  { label: "1. Expand: add column full_name (nullable)", sql: "ALTER TABLE users ADD COLUMN full_name TEXT" },
  { label: "2. Deploy app v2: writes BOTH columns, reads full_name ?? name", deploy: { v2: true } },
  {
    label: "3. Backfill full_name in batches",
    sql: "UPDATE users SET full_name = name WHERE full_name IS NULL",
  },
  { label: "4. Retire app v1 (nothing reads name any more)", deploy: { v1: false } },
  { label: "5. Contract: drop column name", sql: "ALTER TABLE users DROP COLUMN name" },
];

// live = { v1: boolean, v2: boolean }
export function runStep(step, db, live) {
  if (step.sql) db.run(step.sql);
  if (step.deploy) Object.assign(live, step.deploy);
}

// "✓ done", "→ next", "  later"
export function progressText(steps, doneCount) {
  return steps.map((s, i) => (i < doneCount ? "✓ " : i === doneCount ? "→ " : "  ") + s.label).join("\n");
}
