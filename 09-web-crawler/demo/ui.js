// UI only: sliders for the crawl policy and a picture of the per-host queues.
import { HOSTS, SEEDS, hostOf, linksOf, contentOf } from "./fake_web.js";
import { Crawler } from "./crawler.js";

K.title(
  "Web crawler",
  "BFS over a fake web with per-host queues, politeness delays, URL and content dedupe, and a spider trap.",
);

K.section("Controls");
const delay = K.slider("Politeness delay per host (ticks)", 0, 10, 3, 1);
const maxDepth = K.slider("Max depth", 1, 30, 8, 1);
const workers = K.slider("Fetchers", 1, 5, 2, 1);
const run = K.button("Pause", () => {
  loop.toggle();
  run.textContent = loop.running ? "Pause" : "Resume";
});
K.button("Restart", reset);
const st = K.stats({
  fetched: "Fetched",
  frontier: "In frontier",
  dupUrl: "Duplicate URLs skipped",
  dupContent: "Duplicate content",
  trap: "Cut by depth limit",
  waiting: "Hosts throttled now",
});
const cv = K.canvas(170, () => draw());
const log = K.log(110);

let crawler;
function reset() {
  crawler = new Crawler({ hostOf, linksOf, contentOf }, HOSTS, SEEDS);
  log.clear();
  log.add("Seeds: " + SEEDS.join(", "), "muted");
}
function step() {
  const events = crawler.step({
    politenessDelay: delay.value,
    maxDepth: maxDepth.value,
    fetchers: workers.value,
  });
  for (const e of events) {
    if (e.type === "duplicate-content")
      log.add(`${e.url}: same content checksum as a page already stored, skipped`, "muted");
    else if (crawler.counts.cutByDepth % 5 === 1)
      log.add(`depth ${e.depth} > ${maxDepth.value}: dropped ${e.url.slice(0, 40)}`, "warn");
  }
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const columnWidth = (width - 20) / HOSTS.length;
  ctx.font = "12px system-ui";
  HOSTS.forEach((host, i) => {
    const x = 10 + i * columnWidth;
    const queue = crawler.queues[host];
    ctx.fillStyle = K.color("fg");
    ctx.fillText(host + (crawler.isThrottled(host) ? " ⏳" : ""), x, 14);
    ctx.fillStyle = K.color(i);
    ctx.globalAlpha = 0.85;
    queue.slice(0, 22).forEach((_, j) => ctx.fillRect(x, 150 - j * 6, columnWidth - 16, 4));
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("muted");
    ctx.fillText(`${queue.length} queued`, x, 166);
  });
  const c = crawler.counts;
  st.setAll({
    fetched: c.fetched,
    frontier: crawler.frontierSize(),
    dupUrl: c.duplicateUrls,
    dupContent: c.duplicateContent,
    trap: c.cutByDepth,
    waiting: HOSTS.filter((h) => crawler.isThrottled(h) && crawler.queues[h].length).length,
  });
}
reset();
const loop = K.loop(step, 200);
