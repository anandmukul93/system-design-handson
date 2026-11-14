// Trie with cached top-k at every node. Edit me and press Run.
K.title(
  "Search autocomplete",
  "Type a prefix: the path through the trie lights up and each node shows its cached top-k.",
);

const freq = new Map(
  Object.entries({
    twitter: 35,
    twitch: 29,
    twilight: 12,
    tree: 18,
    trie: 9,
    try: 22,
    true: 14,
    train: 20,
    translate: 40,
    travel: 16,
    toy: 11,
    top: 25,
    tomato: 8,
  }),
);
let root;
const K_TOP = 3;
function build() {
  root = { c: {}, top: [] };
  for (const [q] of freq) {
    let n = root;
    for (const ch of q) n = n.c[ch] ??= { c: {}, top: [] };
    n.end = q;
  }
  (function fill(n) {
    // post-order: merge children's top-k
    const cand = n.end ? [n.end] : [];
    for (const ch of Object.values(n.c)) cand.push(...fill(ch));
    n.top = [...new Set(cand)].sort((a, b) => freq.get(b) - freq.get(a)).slice(0, K_TOP);
    return n.top;
  })(root);
}
K.section("Search");
const box = K.text("Query", "tr", () => render(), 200);
K.button(
  "Search it (+5 frequency)",
  () => {
    const q = box.value.trim();
    if (!q) return;
    freq.set(q, (freq.get(q) || 0) + 5);
    build();
    render();
    log.add(`"${q}" now has frequency ${freq.get(q)}; top-k caches on its path rebuilt`, "ok");
  },
  "primary",
);
const sugg = K.table(["Suggestion", "Frequency"]);
const cv = K.canvas(300, () => draw());
const log = K.log(60);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const prefix = box.value;
  // layout: BFS levels up to depth 5
  const levels = [[{ n: root, label: "∅", path: "" }]];
  for (let d = 0; d < 5; d++) {
    const next = [];
    for (const it of levels[d])
      for (const [ch, n] of Object.entries(it.n.c).sort())
        next.push({ n, label: ch, path: it.path + ch, parent: it });
    if (!next.length) break;
    levels.push(next);
  }
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  levels.forEach((lv, d) =>
    lv.forEach((it, i) => {
      it.x = (width * (i + 0.5)) / lv.length;
      it.y = 20 + d * 55;
    }),
  );
  for (const lv of levels)
    for (const it of lv)
      if (it.parent) {
        const on = prefix.startsWith(it.path);
        ctx.strokeStyle = K.color(on ? "c2" : "line");
        ctx.lineWidth = on ? 2.5 : 1;
        ctx.beginPath();
        ctx.moveTo(it.parent.x, it.parent.y);
        ctx.lineTo(it.x, it.y);
        ctx.stroke();
      }
  for (const lv of levels)
    for (const it of lv) {
      const on = prefix.startsWith(it.path),
        here = it.path === prefix;
      ctx.fillStyle = K.color(here ? "c2" : on ? "c1" : it.n.end ? "c3" : "muted");
      ctx.beginPath();
      ctx.arc(it.x, it.y, here ? 10 : 8, 0, 7);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.fillText(it.label, it.x, it.y + 4);
      if (here || (on && it.path.length >= prefix.length - 1 && lv.length < 12)) {
        ctx.fillStyle = K.color("fg");
        ctx.fillText(it.n.top.join(", "), it.x, it.y + 22);
      }
    }
  ctx.textAlign = "start";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("green = end of a query · orange = node for your prefix (its cached top-k below it)", 6, 295);
}
function render() {
  let n = root;
  for (const ch of box.value) {
    n = n && n.c[ch];
  }
  sugg.set(n ? n.top.map((q) => [q, freq.get(q)]) : [["no match", "–"]]);
  draw();
}
build();
render();
log.add(
  "Lookup is O(prefix length): walk down and read the node's cached list. No subtree scan at query time.",
  "muted",
);
