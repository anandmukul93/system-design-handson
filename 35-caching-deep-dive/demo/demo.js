// CDN with TTL, stale-while-revalidate and tag purge; plus an LRU stepper. Edit me and press Run.
K.title("Caching deep dive", "Users in three regions hit edge caches. Tune TTL and SWR, purge by tag, and watch hit ratio, origin load and staleness.");

const REGIONS = ["us", "eu", "ap"], PAGES = Array.from({ length: 30 }, (_, i) => ({ path: "/p/" + i, tag: i < 10 ? "products" : "blog" }));
const edges = Object.fromEntries(REGIONS.map((r) => [r, new Map()]));
const origin = new Map(PAGES.map((p) => [p.path, 1]));            // path → version
let now = 0;
K.section("CDN");
const ttl = K.slider("TTL (s)", 0, 120, 30, 5);
const swr = K.slider("stale-while-revalidate (s)", 0, 120, 30, 5);
const load = K.slider("Requests / s per region", 5, 100, 30, 5);
K.button("Publish new version of products", () => { PAGES.filter((p) => p.tag === "products").forEach((p) => origin.set(p.path, origin.get(p.path) + 1)); log.add("origin: products updated (edges still hold old copies)", "warn"); });
K.button("Purge tag: products", () => { for (const r of REGIONS) for (const [k, v] of edges[r]) if (v.tag === "products") edges[r].delete(k); log.add("purged tag 'products' at every edge", "ok"); });
const st = K.stats({ hit: "Edge hit ratio", origin: "Origin requests / s", stale: "Stale responses / s", slow: "Users waited on origin / s" });
const chart = K.chart([{ name: "hit %" }, { name: "origin rps" }, { name: "stale rps" }], { height: 150 });
const log = K.log(70);

K.loop(() => {
  now++;
  let hits = 0, total = 0, org = 0, stale = 0, slow = 0;
  const rnd = K.rng(now);
  for (const r of REGIONS) for (let i = 0; i < load.value; i++) {
    const p = PAGES[Math.floor(Math.pow(rnd(), 2) * PAGES.length)];           // skewed popularity
    const e = edges[r].get(p.path); total++;
    if (e && now - e.at <= ttl.value) { hits++; if (e.v !== origin.get(p.path)) stale++; continue; }
    if (e && now - e.at <= ttl.value + swr.value) {                             // serve stale, refresh in background
      hits++; stale += e.v !== origin.get(p.path) ? 1 : 0;
      if (!e.refreshing) { e.refreshing = true; org++; edges[r].set(p.path, { v: origin.get(p.path), at: now, tag: p.tag }); }
      continue;
    }
    org++; slow++; edges[r].set(p.path, { v: origin.get(p.path), at: now, tag: p.tag });
  }
  chart.push((100 * hits) / total, org, stale);
  st.setAll({ hit: ((100 * hits) / total).toFixed(0) + "%", origin: org, slow });
  st.set("stale", stale, stale ? "warn" : "ok");
}, 1000 / 3);
log.add("Each tick is one second. TTL 0 sends everything to origin; SWR hides refresh latency.", "muted");

K.section("LRU, step by step");
const cap = K.slider("Capacity", 2, 6, 3, 1, () => { lru.clear(); lruLog.clear(); });
const keyIn = K.text("Access keys (space separated)", "A B C A D B E A", null, 220);
K.button("Step", stepLru, "primary");
const lruView = K.code("");
const lruLog = K.log(80);
const lru = new Map(); let cursor = 0;
function stepLru() {
  const keys = keyIn.value.trim().split(/\s+/); if (!keys[0]) return;
  const k = keys[cursor++ % keys.length];
  if (lru.has(k)) { lru.delete(k); lru.set(k, 1); lruLog.add(`get ${k}: hit, moved to most-recent`, "ok"); }
  else { lru.set(k, 1); if (lru.size > cap.value) { const ev = lru.keys().next().value; lru.delete(ev); lruLog.add(`get ${k}: miss, inserted, evicted LRU ${ev}`, "bad"); } else lruLog.add(`get ${k}: miss, inserted`, "warn"); }
  lruView.set("least recent → " + [...lru.keys()].join("  ") + " ← most recent");
}
lruView.set("press Step");
