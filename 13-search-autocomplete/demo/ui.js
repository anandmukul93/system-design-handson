// UI only: a search box, the suggestion table and a drawing of the trie.
import { Trie } from "./trie.js";
import { SAMPLE_QUERIES } from "./sample_queries.js";

K.title(
  "Search autocomplete",
  "Type a prefix: the path through the trie lights up and each node shows its cached top-k.",
);

const trie = new Trie(3);
for (const [query, count] of Object.entries(SAMPLE_QUERIES)) trie.frequency.set(query, count);
trie.rebuild();

K.section("Search");
const box = K.text("Query", "tr", () => render(), 200);
K.button(
  "Search it (+5 frequency)",
  () => {
    const q = box.value.trim();
    if (!q) return;
    trie.add(q, 5);
    render();
    log.add(`"${q}" now has frequency ${trie.frequency.get(q)}; top-k caches on its path rebuilt`, "ok");
  },
  "primary",
);
const suggestions = K.table(["Suggestion", "Frequency"]);
const cv = K.canvas(300, () => draw());
const log = K.log(60);

const MAX_DEPTH = 5;
function layout(width) {
  // breadth-first levels, each spread evenly across the canvas
  const levels = [[{ node: trie.root, label: "∅", path: "" }]];
  for (let d = 0; d < MAX_DEPTH; d++) {
    const next = [];
    for (const item of levels[d])
      for (const [ch, node] of Object.entries(item.node.children).sort())
        next.push({ node, label: ch, path: item.path + ch, parent: item });
    if (!next.length) break;
    levels.push(next);
  }
  levels.forEach((level, d) =>
    level.forEach((item, i) => {
      item.x = (width * (i + 0.5)) / level.length;
      item.y = 20 + d * 55;
    }),
  );
  return levels;
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const prefix = box.value;
  const levels = layout(width);
  ctx.font = "11px system-ui";
  ctx.textAlign = "center";
  for (const item of levels.flat()) {
    if (!item.parent) continue;
    const onPath = prefix.startsWith(item.path);
    ctx.strokeStyle = K.color(onPath ? "c2" : "line");
    ctx.lineWidth = onPath ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(item.parent.x, item.parent.y);
    ctx.lineTo(item.x, item.y);
    ctx.stroke();
  }
  for (const item of levels.flat()) {
    const onPath = prefix.startsWith(item.path);
    const isPrefixNode = item.path === prefix;
    ctx.fillStyle = K.color(isPrefixNode ? "c2" : onPath ? "c1" : item.node.query ? "c3" : "muted");
    ctx.beginPath();
    ctx.arc(item.x, item.y, isPrefixNode ? 10 : 8, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(item.label, item.x, item.y + 4);
    if (isPrefixNode) {
      ctx.fillStyle = K.color("fg");
      ctx.fillText(item.node.top.join(", "), item.x, item.y + 22);
    }
  }
  ctx.textAlign = "start";
  ctx.fillStyle = K.color("muted");
  ctx.fillText("green = end of a query · orange = node for your prefix (its cached top-k below it)", 6, 295);
}
function render() {
  const rows = trie.suggest(box.value).map((s) => [s.query, s.frequency]);
  suggestions.set(rows.length ? rows : [["no match", "–"]]);
  draw();
}
render();
log.add(
  "Lookup is O(prefix length): walk down and read the node's cached list. No subtree scan at query time.",
  "muted",
);
