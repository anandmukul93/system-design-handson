// Heap graph: reference counting vs mark-and-sweep; then a leaky cache over time. Edit me and press Run.
K.title("Memory and garbage collection", "Build a small object graph, drop roots, make a cycle, and see what each collector frees.");

K.section("Heap");
let objs = [], nextId = 0;
const alloc = (root) => { const o = { id: nextId++, refs: new Set(), root, x: 60 + Math.random() * 480, y: 40 + Math.random() * 160 }; objs.push(o); return o; };
function scenario() {
  objs = []; nextId = 0;
  const a = alloc(true), b = alloc(false), c = alloc(false), d = alloc(true), e = alloc(false), f = alloc(false);
  a.refs.add(b.id); b.refs.add(c.id); d.refs.add(e.id); e.refs.add(f.id); f.refs.add(e.id);   // e <-> f is a cycle
  Object.assign(a, { x: 80, y: 60 }); Object.assign(b, { x: 220, y: 60 }); Object.assign(c, { x: 360, y: 60 });
  Object.assign(d, { x: 80, y: 170 }); Object.assign(e, { x: 220, y: 170 }); Object.assign(f, { x: 360, y: 170 });
  log.add("objects 0 and 3 are roots (think: stack variables). 4 and 5 reference each other.", "muted"); draw();
}
const from = K.text("Add ref from", "2", null, 50), to = K.text("to", "0", null, 50);
K.button("Add reference", () => { const a = objs.find((o) => o.id == from.value), b = objs.find((o) => o.id == to.value); if (a && b) { a.refs.add(b.id); draw(); } });
K.button("Allocate object", () => { alloc(false); draw(); });
K.button("Drop all roots", () => { objs.forEach((o) => (o.root = false)); log.add("roots dropped: nothing is reachable from the program any more", "warn"); draw(); });
K.button("Run reference counting", refcount, "primary");
K.button("Run mark-and-sweep", markSweep, "primary");
K.button("Reset", scenario);
const cv = K.canvas(230, () => draw());
const log = K.log(90);
function refcount() {
  let freed = [], changed = true;
  while (changed) {
    changed = false;
    for (const o of objs) {
      const rc = objs.filter((p) => p.refs.has(o.id)).length + (o.root ? 1 : 0);
      if (rc === 0) { freed.push(o.id); objs = objs.filter((x) => x !== o); changed = true; break; }
    }
  }
  log.add(`refcount freed [${freed.join(", ")}]${objs.some((o) => !o.root) ? `; still alive: [${objs.map((o) => o.id).join(", ")}]` : ""}`, "ok");
  if (objs.length && !objs.some((o) => o.root)) log.add("cycles keep each other's count above 0: leaked under pure refcounting", "bad");
  draw();
}
function markSweep() {
  const marked = new Set(), stack = objs.filter((o) => o.root).map((o) => o.id);
  while (stack.length) { const id = stack.pop(); if (marked.has(id)) continue; marked.add(id); objs.find((o) => o.id === id).refs.forEach((r) => stack.push(r)); }
  const freed = objs.filter((o) => !marked.has(o.id)).map((o) => o.id);
  objs = objs.filter((o) => marked.has(o.id));
  objs.forEach((o) => o.refs.forEach((r) => !marked.has(r) && o.refs.delete(r)));
  log.add(`mark from roots, sweep the rest: freed [${freed.join(", ")}] (cycles included)`, "ok"); draw();
}
function draw() {
  const { ctx } = cv; cv.clear(); ctx.font = "12px system-ui"; ctx.textAlign = "center";
  const by = new Map(objs.map((o) => [o.id, o]));
  ctx.strokeStyle = K.color("muted"); ctx.lineWidth = 1.5;
  for (const o of objs) for (const r of o.refs) { const t = by.get(r); if (!t) continue; const ang = Math.atan2(t.y - o.y, t.x - o.x), ex = t.x - 20 * Math.cos(ang), ey = t.y - 20 * Math.sin(ang); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(ex, ey); ctx.stroke(); ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 8 * Math.cos(ang - 0.4), ey - 8 * Math.sin(ang - 0.4)); ctx.lineTo(ex - 8 * Math.cos(ang + 0.4), ey - 8 * Math.sin(ang + 0.4)); ctx.fill(); }
  for (const o of objs) { ctx.fillStyle = K.color(o.root ? "c1" : "c3"); ctx.beginPath(); ctx.arc(o.x, o.y, 18, 0, 7); ctx.fill(); ctx.fillStyle = "#fff"; ctx.fillText(o.id, o.x, o.y + 4); if (o.root) { ctx.fillStyle = K.color("c1"); ctx.fillText("root", o.x, o.y - 24); } }
  ctx.textAlign = "start";
}

K.section("A service with a leaky cache");
const fixed = K.toggle("Bound the cache (LRU, 5k entries)", false, () => { heap = 50; cache = 0; chart.reset(); });
const chart = K.chart([{ name: "heap MB" }, { name: "GC pause ms" }], { height: 150 });
let heap = 50, cache = 0;
K.loop(() => {
  cache = fixed.value ? Math.min(5000, cache + 200) : cache + 200;          // every request caches a new key, never evicted
  const live = 50 + cache * 0.01, garbage = 30 + Math.random() * 20;
  heap = live + garbage;
  const pause = 2 + live * 0.08 + (heap > 400 ? 40 : 0);                   // old-gen GC cost grows with live set
  chart.push(heap, pause);
}, 250);
scenario();
