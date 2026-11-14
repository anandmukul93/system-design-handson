// Attack/defend sandbox: SQL injection on real SQLite, XSS, CORS, SSRF, request floods. Edit me and press Run.
K.title("Web security", "Each panel has an attack and a defence toggle. Nothing here leaves your browser.");

const SQLJS = "https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/";
let db;
// ---- SQLi ----
K.section("1. SQL injection (real SQLite)");
const user = K.text("Username", "admin' --", null, 160), pass = K.text("Password", "wrong", null, 120);
const param = K.toggle("Defend: parameterized query", false);
K.button("Log in", login, "primary");
const sqlOut = K.code("loading SQLite…");
function login() {
  if (!db) return;
  try {
    let rows;
    if (param.value) { const s = db.prepare("SELECT name FROM users WHERE name = ? AND password = ?"); s.bind([user.value, pass.value]); rows = []; while (s.step()) rows.push(s.get()); s.free(); sqlOut.set(`SELECT name FROM users WHERE name = ? AND password = ?\nparams: [${JSON.stringify(user.value)}, ${JSON.stringify(pass.value)}]\n→ ${rows.length ? "logged in as " + rows[0][0] : "invalid credentials"}`); }
    else { const q = `SELECT name FROM users WHERE name = '${user.value}' AND password = '${pass.value}'`; rows = db.exec(q)[0]?.values || []; sqlOut.set(`${q}\n→ ${rows.length ? "logged in as " + rows[0][0] + (pass.value !== "s3cret" ? "  ⚠ without the password!" : "") : "invalid credentials"}`); }
  } catch (e) { sqlOut.set("SQL error (leaks schema info to attackers): " + e.message); }
}

// ---- XSS ----
K.section("2. Stored XSS");
const comment = K.text("Comment", '<img src=x onerror="document.title=\'pwned\'">nice post', null, 360);
const escape = K.toggle("Defend: escape on output", true);
K.button("Post comment", () => { const html = escape.value ? comment.value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]) : comment.value; box.innerHTML = html; xlog.add(escape.value ? "rendered as text: the payload is inert" : "rendered as HTML: the onerror handler ran (look at the payload's effect)", escape.value ? "ok" : "bad"); }, "primary");
const box = K.h("div", { style: { border: "1px dashed var(--line)", padding: "8px", minHeight: "30px", borderRadius: "6px", marginBottom: "8px" } });
K.cur.append(box);
const xlog = K.log(40);

// ---- CORS ----
K.section("3. CORS policy");
const allow = K.text("Access-Control-Allow-Origin list", "https://app.example.com", null, 260);
const creds = K.toggle("Allow-Credentials", true);
const origin = K.select("Request from origin", ["https://app.example.com", "https://evil.example.net", "null"], "https://evil.example.net");
K.button("Send cross-origin fetch", () => {
  const list = allow.value.split(",").map((s) => s.trim());
  const ok = list.includes(origin.value) || (list.includes("*") && !creds.value);
  const note = list.includes("*") && creds.value ? " (browsers refuse '*' together with credentials)" : "";
  clog.add(`${origin.value} → ${ok ? "browser lets the page read the response" : "response blocked from the page" + note}`, ok ? (origin.value.includes("evil") ? "bad" : "ok") : "warn");
});
const clog = K.log(50);

// ---- SSRF ----
K.section("4. SSRF validator");
const url = K.text("URL the server will fetch", "http://169.254.169.254/latest/meta-data/", null, 320);
const ssrfOn = K.toggle("Defend: validate destination", true);
K.button("Fetch (server side)", () => {
  let u; try { u = new URL(url.value); } catch { return slog.add("not a URL", "bad"); }
  const h = u.hostname, priv = /^(127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|0\.|localhost$|\[?::1\]?$)/.test(h);
  if (!ssrfOn.value) return slog.add(`fetched ${u.href}${priv ? " → returned internal data (cloud credentials!)" : ""}`, priv ? "bad" : "ok");
  if (!["http:", "https:"].includes(u.protocol)) return slog.add(`blocked scheme ${u.protocol}`, "ok");
  if (priv) return slog.add(`blocked: ${h} resolves to a private / link-local address`, "ok");
  slog.add(`allowed ${u.href} (also re-check the resolved IP to stop DNS rebinding)`, "ok");
});
const slog = K.log(50);

// ---- flood ----
K.section("5. Request flood vs WAF + rate limiter");
const flood = K.slider("Attacker requests / s", 0, 5000, 2000, 100);
const waf = K.toggle("WAF blocks known-bad signatures", true), rl = K.toggle("Per-IP rate limit (20 / s)", true);
const chart = K.chart([{ name: "reaching app / s" }, { name: "blocked / s" }], { height: 120 });
K.loop(() => {
  const legit = 100, bots = flood.value, botIps = 20;
  let pass = legit, blocked = 0, atk = bots;
  if (waf.value) { const b = atk * 0.4; atk -= b; blocked += b; }
  if (rl.value) { const cap = botIps * 20; if (atk > cap) { blocked += atk - cap; atk = cap; } }
  chart.push(pass + atk, blocked);
}, 300);

(async () => {
  try {
    await K.loadScript(SQLJS + "sql-wasm.js");
    const SQL = await initSqlJs({ locateFile: (f) => SQLJS + f });
    db = new SQL.Database(); db.run("CREATE TABLE users(name TEXT, password TEXT); INSERT INTO users VALUES ('admin','s3cret'),('ana','pw1');");
    sqlOut.set("SQLite ready. Press Log in.");
  } catch (e) { sqlOut.set("Could not load sql.js (" + e.message + "); this panel needs cdn.jsdelivr.net."); }
})();
