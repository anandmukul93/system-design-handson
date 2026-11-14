// UI only: draws the heap graph, runs the chosen collector on it, and charts the caching service.
import { sampleHeap } from "./heap.js";
import { collectByReferenceCounting } from "./reference_counting.js";
import { collectByMarkAndSweep } from "./mark_and_sweep.js";
import { CachingService } from "./leaky_cache.js";

K.title(
  "Memory and garbage collection",
  "Build a small object graph, drop roots, make a cycle, and see what each collector frees.",
);

K.section("Heap");
let heap;
const positions = new Map(); // object id -> { x, y } on the canvas
function reset() {
  heap = sampleHeap();
  positions.clear();
  heap.ids().forEach((id, i) => positions.set(id, { x: 80 + (i % 3) * 140, y: i < 3 ? 60 : 170 }));
  log.add("objects 0 and 3 are roots (think: stack variables). 4 and 5 reference each other.", "muted");
  draw();
}
const from = K.text("Add ref from", "2", null, 50);
const to = K.text("to", "0", null, 50);
K.button("Add reference", () => {
  if (!heap.addReference(Number(from.value), Number(to.value))) log.add("no such object", "warn");
  draw();
});
K.button("Allocate object", () => {
  const object = heap.allocate(false);
  positions.set(object.id, { x: 60 + Math.random() * 480, y: 40 + Math.random() * 160 });
  draw();
});
K.button("Drop all roots", () => {
  heap.dropRoots();
  log.add("roots dropped: nothing is reachable from the program any more", "warn");
  draw();
});
K.button(
  "Run reference counting",
  () => collect(collectByReferenceCounting, "reference counting"),
  "primary",
);
K.button("Run mark-and-sweep", () => collect(collectByMarkAndSweep, "mark-and-sweep"), "primary");
K.button("Reset", reset);
const cv = K.canvas(230, () => draw());
const log = K.log(90);

function collect(collector, name) {
  const freed = collector(heap);
  const alive = heap.ids();
  log.add(`${name} freed [${freed.join(", ")}]; still alive: [${alive.join(", ")}]`, "ok");
  const anyRoot = alive.some((id) => heap.objects.get(id).root);
  if (alive.length && !anyRoot)
    log.add("unreachable objects survived: a cycle keeps their counts above 0", "bad");
  draw();
}
function draw() {
  const { ctx } = cv;
  cv.clear();
  ctx.font = "12px system-ui";
  ctx.textAlign = "center";
  ctx.strokeStyle = ctx.fillStyle = K.color("muted");
  ctx.lineWidth = 1.5;
  for (const object of heap.objects.values()) {
    const a = positions.get(object.id);
    for (const targetId of object.refs) {
      const b = positions.get(targetId);
      const angle = Math.atan2(b.y - a.y, b.x - a.x);
      const tipX = b.x - 20 * Math.cos(angle);
      const tipY = b.y - 20 * Math.sin(angle);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(tipX, tipY);
      ctx.stroke();
      ctx.beginPath(); // arrow head
      ctx.moveTo(tipX, tipY);
      ctx.lineTo(tipX - 8 * Math.cos(angle - 0.4), tipY - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(tipX - 8 * Math.cos(angle + 0.4), tipY - 8 * Math.sin(angle + 0.4));
      ctx.fill();
    }
  }
  for (const object of heap.objects.values()) {
    const { x, y } = positions.get(object.id);
    ctx.fillStyle = K.color(object.root ? "c1" : "c3");
    ctx.beginPath();
    ctx.arc(x, y, 18, 0, 7);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.fillText(object.id, x, y + 4);
    if (object.root) {
      ctx.fillStyle = K.color("c1");
      ctx.fillText("root", x, y - 24);
    }
  }
  ctx.textAlign = "start";
}

K.section("A service with a leaky cache");
let service = new CachingService();
const bounded = K.toggle("Bound the cache (LRU, 5k entries)", false, () => {
  service = new CachingService(bounded.value ? 5000 : Infinity);
  chart.reset();
});
const chart = K.chart([{ name: "heap MB" }, { name: "GC pause ms" }], { height: 150 });
K.loop(() => {
  const { heapMb, pauseMs } = service.serve(200, Math.random); // every request caches a new key
  chart.push(heapMb, pauseMs);
}, 250);
reset();
