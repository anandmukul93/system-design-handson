// UI only: pick a strategy, post and read, and chart the cost each strategy reports.
// Contract every feed strategy implements:  post(user) -> writes   read(user) -> fetches   isPushed(user) -> bool
import { buildGraph } from "./social_graph.js";
import { PushFeed } from "./push_feed.js";
import { PullFeed } from "./pull_feed.js";
import { HybridFeed } from "./hybrid_feed.js";

K.title(
  "News feed",
  "Post as a user and watch fan-out. Compare write cost and read cost for push, pull and hybrid.",
);

const random = K.rng(11);
const USERS = 200;
const CELEBS = [0, 1, 2];
const graph = buildGraph(USERS, CELEBS, random);
const nameOf = (u) => (CELEBS.includes(u) ? `celeb${u}` : `user${u}`);
const MODES = {
  "push (fan-out on write)": () => new PushFeed(graph),
  "pull (fan-out on read)": () => new PullFeed(graph),
  "hybrid (push, but pull celebrities)": () => new HybridFeed(graph, threshold.value),
};

K.section("Strategy");
const mode = K.select("Fan-out model", Object.keys(MODES), "push (fan-out on write)", reset);
const threshold = K.slider("Hybrid: celebrity threshold (followers)", 10, 200, 100, 10, reset);
K.section("Act");
const who = K.select(
  "Post as",
  [...CELEBS, 10, 20, 30].map((u) => ({
    value: u,
    label: `${nameOf(u)} (${graph.followers[u].size} followers)`,
  })),
  10,
);
K.button("Post", () => post(Number(who.value), true), "primary");
const reader = K.select(
  "Read feed of",
  [5, 50, 150].map((u) => ({ value: u, label: `${nameOf(u)} (follows ${graph.following[u].size})` })),
  5,
);
K.button("Read feed", () => read(Number(reader.value), true));
const traffic = K.toggle("Background traffic (90% reads)", true);
const st = K.stats({
  writes: "Feed-cache writes",
  reads: "Fetches on read",
  lastW: "Last post: writes",
  lastR: "Last read: fetches",
  posts: "Posts",
});
const chart = K.chart([{ name: "write ops / tick" }, { name: "read ops / tick" }], { height: 150 });
const log = K.log(90);

let feed;
let totals = { writes: 0, reads: 0, posts: 0 };
let tick = { writes: 0, reads: 0 };
function reset() {
  feed = MODES[mode.value]();
  totals = { writes: 0, reads: 0, posts: 0 };
  chart.reset();
  log.add(`switched to ${mode.value}`, "muted");
}
function post(user, announce) {
  const writes = feed.post(user);
  totals.writes += writes;
  totals.posts++;
  tick.writes += writes;
  if (!announce) return;
  st.set("lastW", writes, writes > 50 ? "bad" : "ok");
  const note = feed.isPushed(user) ? "" : " (not fanned out; followers pull it)";
  log.add(`${nameOf(user)} posted: ${writes} writes${note}`, writes > 50 ? "warn" : "ok");
}
function read(user, announce) {
  const fetches = feed.read(user);
  totals.reads += fetches;
  tick.reads += fetches;
  if (!announce) return;
  st.set("lastR", fetches, fetches > 20 ? "bad" : "ok");
  log.add(`${nameOf(user)} read feed: ${fetches} fetches`, fetches > 20 ? "warn" : "ok");
}
reset();
K.loop(() => {
  if (traffic.value) {
    for (let i = 0; i < 20; i++) {
      const user = Math.floor(random() * USERS);
      if (random() < 0.1) post(random() < 0.05 ? CELEBS[0] : user, false);
      else read(user, false);
    }
  }
  chart.push(tick.writes, tick.reads);
  tick = { writes: 0, reads: 0 };
  st.setAll({ writes: totals.writes, reads: totals.reads, posts: totals.posts });
}, 250);
