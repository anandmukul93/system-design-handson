// News feed fan-out: push vs pull vs hybrid with celebrities. Edit me and press Run.
K.title(
  "News feed",
  "Post as a user and watch fan-out. Compare write cost and read cost for push, pull and hybrid.",
);

const rnd = K.rng(11);
const USERS = 200,
  CELEBS = [0, 1, 2];
const followers = Array.from({ length: USERS }, () => new Set());
const following = Array.from({ length: USERS }, () => new Set());
function follow(a, b) {
  if (a !== b) {
    followers[b].add(a);
    following[a].add(b);
  }
}
for (let u = 0; u < USERS; u++) {
  for (const c of CELEBS) if (rnd() < 0.9) follow(u, c);
  for (let k = 0; k < 8; k++) follow(u, Math.floor(rnd() * USERS));
}
const name = (u) => (CELEBS.includes(u) ? `celeb${u}` : `user${u}`);

K.section("Strategy");
const mode = K.select(
  "Fan-out model",
  ["push (fan-out on write)", "pull (fan-out on read)", "hybrid (push, but pull celebrities)"],
  "push (fan-out on write)",
  reset,
);
const threshold = K.slider("Hybrid: celebrity threshold (followers)", 10, 200, 100, 10);
K.section("Act");
const who = K.select(
  "Post as",
  [...CELEBS, 10, 20, 30].map((u) => ({ value: u, label: `${name(u)} (${followers[u].size} followers)` })),
  10,
);
K.button("Post", () => post(Number(who.value)), "primary");
const reader = K.select(
  "Read feed of",
  [5, 50, 150].map((u) => ({ value: u, label: `${name(u)} (follows ${following[u].size})` })),
  5,
);
K.button("Read feed", () => read(Number(reader.value)));
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

let feeds, posts, writes, reads, tw, tr;
function reset() {
  feeds = Array.from({ length: USERS }, () => []);
  posts = Array.from({ length: USERS }, () => []);
  writes = reads = 0;
  chart.reset();
  log.add(`switched to ${mode.value}`, "muted");
}
const isPushed = (u) =>
  mode.value.startsWith("push") || (mode.value.startsWith("hybrid") && followers[u].size < threshold.value);
function post(u, quiet) {
  const p = { u, t: Date.now() };
  posts[u].push(p);
  let w = 1;
  if (isPushed(u))
    for (const f of followers[u]) {
      feeds[f].unshift(p);
      feeds[f].length = Math.min(feeds[f].length, 50);
      w++;
    }
  writes += w;
  tw += w;
  if (!quiet) {
    st.set("lastW", w, w > 50 ? "bad" : "ok");
    log.add(
      `${name(u)} posted: ${w} writes${isPushed(u) ? "" : " (not fanned out; followers pull it)"}`,
      w > 50 ? "warn" : "ok",
    );
  }
}
function read(u, quiet) {
  let r = 1; // read precomputed feed
  for (const f of following[u]) if (!isPushed(f)) r++; // pull from each un-pushed followee
  reads += r;
  tr += r;
  if (!quiet) {
    st.set("lastR", r, r > 20 ? "bad" : "ok");
    log.add(`${name(u)} read feed: ${r} fetches`, r > 20 ? "warn" : "ok");
  }
}
reset();
K.loop(() => {
  tw = tr = 0;
  if (traffic.value)
    for (let i = 0; i < 20; i++) {
      const u = Math.floor(rnd() * USERS);
      if (rnd() < 0.1) post(rnd() < 0.05 ? CELEBS[0] : u, true);
      else read(u, true);
    }
  chart.push(tw, tr);
  st.setAll({ writes, reads, posts: posts.reduce((a, p) => a + p.length, 0) });
}, 250);
