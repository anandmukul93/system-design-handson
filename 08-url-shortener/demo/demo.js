// URL shortener: base62 IDs, cache-aside reads, 301 vs 302. Edit me and press Run.
K.title("URL shortener", "Shorten URLs, see the base62 encoding of each ID, then click short links through cache and database.");

const ALPHA = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
function base62(n) { if (n === 0) return { s: "0", steps: ["0 → '0'"] }; const steps = []; let s = ""; while (n > 0) { const r = n % 62; steps.push(`${n} % 62 = ${r} → '${ALPHA[r]}'`); s = ALPHA[r] + s; n = Math.floor(n / 62); } return { s, steps }; }

let nextId = 100000000000;          // start high so codes are 7 chars, like a real service
const db = new Map(), cache = new Map(), browser = new Set();
let hits = 0, misses = 0, dbReads = 0, browserServed = 0;
const CACHE_SIZE = 4;

K.section("Shorten");
const url = K.text("Long URL", "https://example.com/articles/2026/how-consistent-hashing-works?ref=newsletter", null, 360);
const strategy = K.select("ID strategy", [{ value: "counter", label: "global counter + base62" }, { value: "hash", label: "hash + collision check" }], "counter");
K.button("Shorten", shorten, "primary");
const steps = K.code("Press Shorten.");

K.section("Redirect");
const redirect = K.select("Redirect code", [{ value: 302, label: "302 Found (every click reaches us: analytics)" }, { value: 301, label: "301 Moved Permanently (browser caches it)" }], 302);
const st = K.stats({ urls: "Short URLs", hits: "Cache hits", misses: "Cache misses", db: "DB reads", browser: "Served by browser cache" });
const table = K.table(["Short", "Long URL", "", "Where it was served"]);
const log = K.log(110);

function shorten() {
  const long = url.value.trim();
  if (!long) return;
  let code, id;
  if (strategy.value === "counter") {
    id = nextId++;
    const r = base62(id); code = r.s;
    steps.set(`id = ${id}\n` + r.steps.join("\n") + `\nread remainders bottom-up → ${code}`);
  } else {
    let salt = 0;
    do { code = (K.hash(long + (salt ? "#" + salt : "")) >>> 0).toString(36).slice(0, 7); salt++; } while (db.has(code) && db.get(code) !== long);
    steps.set(`hash("${long.slice(0, 30)}…") → first 7 chars = ${code}` + (salt > 1 ? `\ncollided ${salt - 1}x, appended a salt and rehashed` : "\nno collision in the DB"));
  }
  db.set(code, long);
  log.add(`created /${code}`, "ok");
  render();
}
function click(code) {
  if (redirect.value == 301 && browser.has(code)) { browserServed++; log.add(`/${code}: browser cached 301, request never reached the server (no analytics)`, "warn"); return render(); }
  if (cache.has(code)) { hits++; const v = cache.get(code); cache.delete(code); cache.set(code, v); log.add(`/${code}: cache HIT → ${redirect.value}`, "ok"); }
  else { misses++; dbReads++; const v = db.get(code); cache.set(code, v); if (cache.size > CACHE_SIZE) { const old = cache.keys().next().value; cache.delete(old); log.add(`cache full, evicted LRU /${old}`, "muted"); } log.add(`/${code}: cache MISS → DB read → filled cache → ${redirect.value}`, "warn"); }
  if (redirect.value == 301) browser.add(code); else browser.clear();
  render();
}
function render() {
  st.setAll({ urls: db.size, hits, misses, db: dbReads, browser: browserServed });
  table.set([...db].slice(-8).reverse().map(([c, l]) => {
    const b = K.h("button", { class: "k-btn", onclick: () => click(c) }, "click");
    return ["/" + c, l.length > 46 ? l.slice(0, 46) + "…" : l, b, browser.has(c) && redirect.value == 301 ? "browser" : cache.has(c) ? "cache" : "db"];
  }));
}
for (const u of ["https://example.com/a", "https://example.com/b", "https://example.com/c"]) { url.value = u; shorten(); }
url.value = "https://example.com/articles/2026/how-consistent-hashing-works?ref=newsletter";
log.add(`Cache holds ${CACHE_SIZE} entries (LRU). Click the same link twice; switch to 301 and click again.`, "muted");
