// UI only: simulates users in three regions hitting the edges, and steps an LRU cache key by key.
import { Origin } from "./origin.js";
import { EdgeCache } from "./edge_cache.js";
import { LruCache } from "./lru.js";

K.title(
  "Caching deep dive",
  "Users in three regions hit edge caches. Tune TTL and SWR, purge by tag, and watch hit ratio, origin load and staleness.",
);

const origin = new Origin();
const edges = ["us", "eu", "ap"].map(() => new EdgeCache(origin));
let now = 0; // seconds

K.section("CDN");
const ttl = K.slider("TTL (s)", 0, 120, 30, 5);
const swr = K.slider("stale-while-revalidate (s)", 0, 120, 30, 5);
const load = K.slider("Requests / s per region", 5, 100, 30, 5);
K.button("Publish new version of products", () => {
  origin.publish("products");
  log.add("origin: products updated (edges still hold old copies)", "warn");
});
K.button("Purge tag: products", () => {
  for (const edge of edges) edge.purgeTag("products");
  log.add("purged tag 'products' at every edge", "ok");
});
const st = K.stats({
  hit: "Edge hit ratio",
  origin: "Origin requests / s",
  stale: "Outdated responses / s",
  slow: "Users waited on origin / s",
});
const chart = K.chart([{ name: "hit %" }, { name: "origin rps" }, { name: "outdated rps" }], { height: 150 });
const log = K.log(70);

K.loop(() => {
  now++;
  const random = K.rng(now);
  const policy = { ttl: ttl.value, swr: swr.value };
  const fetchesBefore = origin.fetches;
  let total = 0;
  let servedFromEdge = 0;
  let outdated = 0;
  let waited = 0;
  for (const edge of edges) {
    for (let i = 0; i < load.value; i++) {
      const page = origin.pages[Math.floor(random() ** 2 * origin.pages.length)]; // skewed popularity
      const r = edge.request(page, now, policy);
      total++;
      if (r.served === "miss") waited++;
      else servedFromEdge++;
      if (r.outdated) outdated++;
    }
  }
  const hitPercent = (100 * servedFromEdge) / total;
  const originRequests = origin.fetches - fetchesBefore;
  chart.push(hitPercent, originRequests, outdated);
  st.setAll({ hit: hitPercent.toFixed(0) + "%", origin: originRequests, slow: waited });
  st.set("stale", outdated, outdated ? "warn" : "ok");
}, 1000 / 3);
log.add("Each tick is one second. TTL 0 sends everything to origin; SWR hides refresh latency.", "muted");

K.section("LRU, step by step");
let lru = new LruCache(3);
let cursor = 0;
const capacity = K.slider("Capacity", 2, 6, 3, 1, () => {
  lru = new LruCache(capacity.value);
  cursor = 0;
  lruLog.clear();
  lruView.set("press Step");
});
const keyInput = K.text("Access keys (space separated)", "A B C A D B E A", null, 220);
K.button("Step", stepLru, "primary");
const lruView = K.code("press Step");
const lruLog = K.log(80);
function stepLru() {
  const keys = keyInput.value.trim().split(/\s+/);
  if (!keys[0]) return;
  const key = keys[cursor++ % keys.length];
  const r = lru.access(key);
  if (r.hit) lruLog.add(`get ${key}: hit, moved to most-recent`, "ok");
  else if (r.evicted) lruLog.add(`get ${key}: miss, inserted, evicted LRU ${r.evicted}`, "bad");
  else lruLog.add(`get ${key}: miss, inserted`, "warn");
  lruView.set("least recent → " + lru.keys().join("  ") + " ← most recent");
}
