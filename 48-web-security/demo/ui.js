// UI only: one panel per attack, each with a defence toggle.
import { SQLJS_CDN, createUserDatabase, loginByConcatenation, loginWithParameters } from "./sql_login.js";
import { renderComment } from "./xss.js";
import { corsDecision } from "./cors.js";
import { validateDestination, isPrivateHost } from "./ssrf.js";
import { filterTraffic } from "./flood.js";

K.title("Web security", "Each panel has an attack and a defence toggle. Nothing here leaves your browser.");

// ---- 1. SQL injection ----
K.section("1. SQL injection (real SQLite)");
let db = null;
const username = K.text("Username", "admin' --", null, 160);
const password = K.text("Password", "wrong", null, 120);
const parameterized = K.toggle("Defend: parameterized query", false);
K.button("Log in", login, "primary");
const sqlOut = K.code("loading SQLite…");
function login() {
  if (!db) return;
  const variant = parameterized.value ? loginWithParameters : loginByConcatenation;
  try {
    const r = variant(db, username.value, password.value);
    const bypassed = r.user && password.value !== "s3cret" && password.value !== "pw1";
    const outcome = r.user
      ? `logged in as ${r.user}${bypassed ? "  ⚠ without the password!" : ""}`
      : "invalid credentials";
    sqlOut.set(
      [r.query, r.params && "params: " + JSON.stringify(r.params), "→ " + outcome].filter(Boolean).join("\n"),
    );
  } catch (e) {
    sqlOut.set("SQL error (leaks schema info to attackers): " + e.message);
  }
}

// ---- 2. XSS ----
K.section("2. Stored XSS");
const comment = K.text("Comment", "<img src=x onerror=\"document.title='pwned'\">nice post", null, 360);
const escapeOutput = K.toggle("Defend: escape on output", true);
K.button(
  "Post comment",
  () => {
    commentBox.innerHTML = renderComment(comment.value, escapeOutput.value);
    if (escapeOutput.value) xssLog.add("rendered as text: the payload is inert", "ok");
    else xssLog.add("rendered as HTML: the onerror handler ran inside this page", "bad");
  },
  "primary",
);
const commentBox = K.h("div", {
  style: {
    border: "1px dashed var(--line)",
    padding: "8px",
    minHeight: "30px",
    borderRadius: "6px",
    marginBottom: "8px",
  },
});
K.cur.append(commentBox);
const xssLog = K.log(40);

// ---- 3. CORS ----
K.section("3. CORS policy");
const allowList = K.text("Access-Control-Allow-Origin list", "https://app.example.com", null, 260);
const credentials = K.toggle("Allow-Credentials", true);
const origin = K.select(
  "Request from origin",
  ["https://app.example.com", "https://evil.example.net", "null"],
  "https://evil.example.net",
);
K.button("Send cross-origin fetch", () => {
  const allowed = allowList.value.split(",").map((s) => s.trim());
  const r = corsDecision(allowed, credentials.value, origin.value);
  const text = r.allowed ? "browser lets the page read the response" : "response blocked from the page";
  const kind = !r.allowed ? "warn" : origin.value.includes("evil") ? "bad" : "ok";
  corsLog.add(`${origin.value} → ${text}${r.note}`, kind);
});
const corsLog = K.log(50);

// ---- 4. SSRF ----
K.section("4. SSRF validator");
const url = K.text("URL the server will fetch", "http://169.254.169.254/latest/meta-data/", null, 320);
const validate = K.toggle("Defend: validate destination", true);
K.button("Fetch (server side)", () => {
  if (validate.value) {
    const r = validateDestination(url.value);
    return ssrfLog.add(r.reason, r.allowed || r.reason !== "not a URL" ? "ok" : "bad");
  }
  let hostname;
  try {
    hostname = new URL(url.value).hostname;
  } catch {
    return ssrfLog.add("not a URL", "bad");
  }
  const internal = isPrivateHost(hostname);
  ssrfLog.add(
    `fetched ${url.value}${internal ? " → returned internal data (cloud credentials!)" : ""}`,
    internal ? "bad" : "ok",
  );
});
const ssrfLog = K.log(50);

// ---- 5. flood ----
K.section("5. Request flood vs WAF + rate limiter");
const flood = K.slider("Attacker requests / s", 0, 5000, 2000, 100);
const waf = K.toggle("WAF blocks known-bad signatures", true);
const rateLimit = K.toggle("Per-IP rate limit (20 / s)", true);
const chart = K.chart([{ name: "reaching app / s" }, { name: "blocked / s" }], { height: 120 });
K.loop(() => {
  const r = filterTraffic({
    legitimate: 100,
    attack: flood.value,
    attackerIps: 20,
    waf: waf.value,
    rateLimit: rateLimit.value,
  });
  chart.push(r.reachingApp, r.blocked);
}, 300);

(async () => {
  try {
    await K.loadScript(SQLJS_CDN + "sql-wasm.js");
    db = createUserDatabase(await initSqlJs({ locateFile: (file) => SQLJS_CDN + file }));
    sqlOut.set("SQLite ready. Press Log in.");
  } catch (e) {
    sqlOut.set(`Could not load sql.js (${e.message}); this panel needs cdn.jsdelivr.net.`);
  }
})();
