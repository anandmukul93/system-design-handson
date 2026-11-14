// Web crawler on a generated fake web: frontier, politeness, dedupe, trap. Edit me and press Run.
K.title("Web crawler", "BFS over a fake web with per-host queues, politeness delays, URL and content dedupe, and a spider trap.");

const HOSTS = ["news.test", "shop.test", "blog.test", "wiki.test", "trap.test"];
function linksOf(url) {                    // deterministic fake web
  const host = url.split("/")[0], path = url.slice(url.indexOf("/"));
  if (host === "trap.test") return [`trap.test${path}x/`];       // infinite calendar-like trap
  const r = K.rng(K.hash(url));
  return Array.from({ length: 2 + Math.floor(r() * 3) }, () => `${HOSTS[Math.floor(r() * HOSTS.length)]}/p${Math.floor(r() * 12)}`);
}
const contentOf = (url) => url.endsWith("p3") || url.endsWith("p7") ? "mirror-of-home" : url;   // duplicates by content

K.section("Controls");
const delay = K.slider("Politeness delay per host (ticks)", 0, 10, 3, 1);
const maxDepth = K.slider("Max depth", 1, 30, 8, 1);
const workers = K.slider("Fetchers", 1, 5, 2, 1);
const run = K.button("Pause", () => { loop.toggle(); run.textContent = loop.running ? "Pause" : "Resume"; });
K.button("Restart", reset);
const st = K.stats({ fetched: "Fetched", frontier: "In frontier", dupUrl: "Duplicate URLs skipped", dupContent: "Duplicate content", trap: "Cut by depth limit", waiting: "Hosts throttled now" });
const cv = K.canvas(170, () => draw());
const log = K.log(110);

let queues, seenUrl, seenContent, nextOk, tick, s, fetchedList;
function reset() {
  queues = Object.fromEntries(HOSTS.map((h) => [h, []])); seenUrl = new Set(); seenContent = new Set(); nextOk = {}; tick = 0; fetchedList = [];
  s = { fetched: 0, dupUrl: 0, dupContent: 0, trap: 0 };
  for (const seed of ["news.test/", "shop.test/", "trap.test/"]) enqueue(seed, 0);
  log.clear(); log.add("Seeds: news.test, shop.test, trap.test", "muted");
}
function enqueue(url, depth) {
  if (seenUrl.has(url)) { s.dupUrl++; return; }
  if (depth > maxDepth.value) { s.trap++; if (s.trap % 5 === 1) log.add(`depth ${depth} > ${maxDepth.value}: dropped ${url.slice(0, 40)}`, "warn"); return; }
  seenUrl.add(url); queues[url.split("/")[0]].push({ url, depth });
}
function step() {
  tick++;
  let used = 0;
  for (const h of HOSTS) {
    if (used >= workers.value) break;
    const q = queues[h];
    if (!q.length || (nextOk[h] || 0) > tick) continue;
    const { url, depth } = q.shift(); used++;
    nextOk[h] = tick + delay.value;
    const c = contentOf(url);
    if (seenContent.has(c)) { s.dupContent++; log.add(`${url}: same content checksum as a page already stored, skipped`, "muted"); continue; }
    seenContent.add(c); s.fetched++; fetchedList.push(h);
    for (const l of linksOf(url)) enqueue(l, depth + 1);
  }
  draw();
}
function draw() {
  const { ctx, width } = cv; cv.clear();
  const colW = (width - 20) / HOSTS.length;
  ctx.font = "12px system-ui";
  HOSTS.forEach((h, i) => {
    const x = 10 + i * colW, throttled = (nextOk[h] || 0) > tick;
    ctx.fillStyle = K.color("fg"); ctx.fillText(h + (throttled ? " ⏳" : ""), x, 14);
    ctx.fillStyle = K.color(i); ctx.globalAlpha = 0.85;
    queues[h].slice(0, 22).forEach((_, j) => ctx.fillRect(x, 150 - j * 6, colW - 16, 4));
    ctx.globalAlpha = 1; ctx.fillStyle = K.color("muted"); ctx.fillText(`${queues[h].length} queued`, x, 166);
  });
  const waiting = HOSTS.filter((h) => (nextOk[h] || 0) > tick && queues[h].length).length;
  st.setAll({ ...s, frontier: HOSTS.reduce((a, h) => a + queues[h].length, 0), waiting });
}
reset();
const loop = K.loop(step, 200);
