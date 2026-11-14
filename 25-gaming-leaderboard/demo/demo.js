// Leaderboard on a skip list (like a Redis sorted set). Edit me and press Run.
K.title(
  "Gaming leaderboard",
  "Players score live. Each insert flips coins for its levels; a rank lookup walks the express lanes.",
);

const MAXL = 6,
  rnd = K.rng(25);
const head = { score: Infinity, name: "HEAD", next: Array(MAXL).fill(null), span: Array(MAXL).fill(0) };
const byName = new Map();
let lastPath = [];
// Sorted by score descending (ties by name). span[i] = how many nodes the level-i link skips, which gives O(log n) rank.
const before = (a, score, name) => a.score > score || (a.score === score && a.name < name);
function insert(name, score) {
  const update = [],
    rank = [];
  let x = head;
  for (let i = MAXL - 1; i >= 0; i--) {
    rank[i] = i === MAXL - 1 ? 0 : rank[i + 1];
    while (x.next[i] && before(x.next[i], score, name)) {
      rank[i] += x.span[i];
      x = x.next[i];
    }
    update[i] = x;
  }
  let lvl = 1;
  while (lvl < MAXL && rnd() < 0.5) lvl++;
  const n = { name, score, lvl, next: Array(MAXL).fill(null), span: Array(MAXL).fill(0) };
  for (let i = 0; i < MAXL; i++) {
    if (i < lvl) {
      n.next[i] = update[i].next[i];
      update[i].next[i] = n;
      n.span[i] = update[i].span[i] - (rank[0] - rank[i]);
      update[i].span[i] = rank[0] - rank[i] + 1;
    } else update[i].span[i]++;
  }
  byName.set(name, n);
  return n;
}
function unlink(n) {
  let x = head;
  for (let i = MAXL - 1; i >= 0; i--) {
    while (x.next[i] && x.next[i] !== n && before(x.next[i], n.score, n.name)) x = x.next[i];
    if (x.next[i] === n) {
      x.span[i] += n.span[i] - 1;
      x.next[i] = n.next[i];
    } else x.span[i]--;
  }
  byName.delete(n.name);
}
function rankOf(name) {
  const t = byName.get(name);
  if (!t) return null;
  let x = head,
    r = 0;
  lastPath = [];
  for (let i = MAXL - 1; i >= 0; i--) {
    while (x.next[i] && (before(x.next[i], t.score, t.name) || x.next[i] === t)) {
      r += x.span[i];
      x = x.next[i];
      lastPath.push([x, i]);
    }
    if (x === t) return r;
  }
  return r;
}
const addScore = (name, pts) => {
  const n = byName.get(name);
  const s = (n ? n.score : 0) + pts;
  if (n) unlink(n);
  insert(name, s);
};
const NAMES = "ash bea cy dot eli fay gus hal ivy jo kai lu mo nia oz pip".split(" ");
NAMES.forEach((n) => insert(n, Math.floor(rnd() * 500)));

K.section("Play");
const live = K.toggle("Live scoring", true);
const who = K.select("Look up player", NAMES, "ivy", () => lookup());
K.button("Rank + neighbours", () => lookup(), "primary");
const st = K.stats({ rank: "Rank", score: "Score", steps: "Nodes visited", n: "Players" });
const cv = K.canvas(MAXL * 22 + 40, () => draw());
const table = K.table(["#", "Player", "Score"]);

function lookup() {
  const r = rankOf(who.value),
    n = byName.get(who.value);
  st.setAll({ rank: r, score: n.score, steps: `${lastPath.length} (linear scan: ${r})`, n: byName.size });
  const list = [];
  for (let x = head.next[0]; x; x = x.next[0]) list.push(x);
  const from = Math.max(0, r - 3);
  table.set(
    list
      .slice(from, r + 2)
      .map((x, i) => [from + i + 1, x.name === who.value ? "▶ " + x.name : x.name, x.score]),
  );
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "10px system-ui";
  ctx.textAlign = "center";
  const list = [];
  for (let x = head.next[0]; x; x = x.next[0]) list.push(x);
  const cw = (width - 50) / list.length,
    pos = new Map([[head, 20]]);
  list.forEach((x, i) => pos.set(x, 50 + i * cw + cw / 2));
  const onPath = new Set(lastPath.map(([x]) => x));
  for (let i = 0; i < MAXL; i++) {
    const y = 18 + (MAXL - 1 - i) * 22;
    for (let x = head; x; x = x.next[i]) {
      if (x.next[i]) {
        const hot = lastPath.some(([p, l]) => p === x.next[i] && l === i);
        ctx.strokeStyle = K.color(hot ? "c2" : "line");
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(pos.get(x), y);
        ctx.lineTo(pos.get(x.next[i]), y);
        ctx.stroke();
      }
      if (x !== head) {
        ctx.fillStyle = K.color(x.name === who.value ? "c2" : onPath.has(x) ? "c1" : "muted");
        ctx.fillRect(pos.get(x) - cw / 2 + 2, y - 7, cw - 4, 14);
      }
    }
  }
  ctx.fillStyle = K.color("fg");
  list.forEach((x) => {
    ctx.fillText(x.name, pos.get(x), MAXL * 22 + 22);
    ctx.fillText(x.score, pos.get(x), MAXL * 22 + 34);
  });
  ctx.textAlign = "start";
}
lookup();
K.loop(() => {
  if (!live.value) return;
  addScore(NAMES[Math.floor(rnd() * NAMES.length)], Math.floor(rnd() * 60));
  lookup();
}, 700);
