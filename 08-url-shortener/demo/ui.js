// UI only: a form to shorten URLs and a table of links to click.
// Contract for an id strategy:  makeCode(longUrl, isTaken) -> { code, explanation }
import { CounterStrategy } from "./counter_base62.js";
import { HashStrategy } from "./hash_strategy.js";
import { Shortener } from "./shortener.js";

const CACHE_SIZE = 4;
const service = new Shortener(CACHE_SIZE);
const strategies = { counter: new CounterStrategy(), hash: new HashStrategy(K.hash) };

K.title(
  "URL shortener",
  "Shorten URLs, see the base62 encoding of each ID, then click short links through cache and database.",
);

K.section("Shorten");
const DEFAULT_URL = "https://example.com/articles/2026/how-consistent-hashing-works?ref=newsletter";
const url = K.text("Long URL", DEFAULT_URL, null, 360);
const strategy = K.select(
  "ID strategy",
  [
    { value: "counter", label: "global counter + base62" },
    { value: "hash", label: "hash + collision check" },
  ],
  "counter",
);
K.button("Shorten", shorten, "primary");
const steps = K.code("Press Shorten.");

K.section("Redirect");
const redirect = K.select(
  "Redirect code",
  [
    { value: 302, label: "302 Found (every click reaches us: analytics)" },
    { value: 301, label: "301 Moved Permanently (browser caches it)" },
  ],
  302,
  () => render(),
);
const st = K.stats({
  urls: "Short URLs",
  hits: "Cache hits",
  misses: "Cache misses",
  db: "DB reads",
  browser: "Served by browser cache",
});
const table = K.table(["Short", "Long URL", "", "Next click served by"]);
const log = K.log(110);

function shorten() {
  const long = url.value.trim();
  if (!long) return;
  const { code, explanation } = service.create(long, strategies[strategy.value]);
  steps.set(explanation);
  log.add(`created /${code}`, "ok");
  render();
}
function click(code) {
  const status = Number(redirect.value);
  const { servedBy, evicted } = service.resolve(code, status);
  if (evicted) log.add(`cache full, evicted LRU /${evicted}`, "muted");
  if (servedBy === "browser")
    log.add(`/${code}: browser cached 301, request never reached the server (no analytics)`, "warn");
  else if (servedBy === "cache") log.add(`/${code}: cache HIT → ${status}`, "ok");
  else log.add(`/${code}: cache MISS → DB read → filled cache → ${status}`, "warn");
  render();
}
function render() {
  const status = Number(redirect.value);
  const c = service.counts;
  st.setAll({
    urls: service.db.size,
    hits: c.hits,
    misses: c.misses,
    db: c.dbReads,
    browser: c.servedByBrowser,
  });
  table.set(
    [...service.db]
      .slice(-8)
      .reverse()
      .map(([code, long]) => [
        "/" + code,
        long.length > 46 ? long.slice(0, 46) + "…" : long,
        K.h("button", { class: "k-btn", onclick: () => click(code) }, "click"),
        service.location(code, status),
      ]),
  );
}
for (const u of ["https://example.com/a", "https://example.com/b", "https://example.com/c"]) {
  url.value = u;
  shorten();
}
url.value = DEFAULT_URL;
log.add(
  `Cache holds ${CACHE_SIZE} entries (LRU). Click the same link twice; switch to 301 and click again.`,
  "muted",
);
