// UI only: live scoring, a rank lookup and a drawing of the skip list's levels and search path.
import { Leaderboard } from "./leaderboard.js";

K.title(
  "Gaming leaderboard",
  "Players score live. Each insert flips coins for its levels; a rank lookup walks the express lanes.",
);

const random = K.rng(25);
const board = new Leaderboard(random);
const NAMES = "ash bea cy dot eli fay gus hal ivy jo kai lu mo nia oz pip".split(" ");
NAMES.forEach((name) => board.addPoints(name, Math.floor(random() * 500)));
let lastPath = [];

K.section("Play");
const live = K.toggle("Live scoring", true);
const who = K.select("Look up player", NAMES, "ivy", () => lookup());
K.button("Rank + neighbours", () => lookup(), "primary");
const st = K.stats({ rank: "Rank", score: "Score", steps: "Nodes visited", n: "Players" });
const LEVELS = board.list.maxLevel;
const cv = K.canvas(LEVELS * 22 + 40, () => draw());
const table = K.table(["#", "Player", "Score"]);

function lookup() {
  const { rank, path } = board.rank(who.value);
  lastPath = path;
  st.setAll({
    rank,
    score: board.score(who.value),
    steps: `${path.length} (linear scan: ${rank})`,
    n: board.list.byName.size,
  });
  table.set(
    board.neighbours(who.value).map((p) => [p.rank, p.name === who.value ? "▶ " + p.name : p.name, p.score]),
  );
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  const nodes = board.list.toArray();
  const head = board.list.head;
  const cellWidth = (width - 50) / nodes.length;
  const xOf = new Map([[head, 20]]);
  nodes.forEach((node, i) => xOf.set(node, 50 + i * cellWidth + cellWidth / 2));
  const visited = new Set(lastPath.map(([node]) => node));
  for (let level = 0; level < LEVELS; level++) {
    const y = 18 + (LEVELS - 1 - level) * 22;
    for (let x = head; x; x = x.next[level]) {
      const next = x.next[level];
      if (next) {
        const taken = lastPath.some(([node, l]) => node === next && l === level);
        ctx.strokeStyle = K.color(taken ? "c2" : "line");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xOf.get(x), y);
        ctx.lineTo(xOf.get(next), y);
        ctx.stroke();
      }
      if (x !== head) {
        ctx.fillStyle = K.color(x.name === who.value ? "c2" : visited.has(x) ? "c1" : "muted");
        ctx.fillRect(xOf.get(x) - cellWidth / 2 + 2, y - 7, cellWidth - 4, 14);
      }
    }
  }
  ctx.fillStyle = K.color("fg");
  for (const node of nodes) {
    ctx.fillText(node.name, xOf.get(node), LEVELS * 22 + 22);
    ctx.fillText(node.score, xOf.get(node), LEVELS * 22 + 34);
  }
  ctx.textAlign = "start";
}
lookup();
K.loop(() => {
  if (!live.value) return;
  board.addPoints(NAMES[Math.floor(random() * NAMES.length)], Math.floor(random() * 60));
  lookup();
}, 700);
