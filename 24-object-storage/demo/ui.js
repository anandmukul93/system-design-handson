// UI only: buttons that call ObjectStore, a drawing of the data files, and a durability comparison.
import { ObjectStore, FILE_SIZE } from "./data_files.js";
import { replication, erasureCoding } from "./durability.js";

K.title(
  "Object storage",
  "Objects append into fixed-size data files. Delete, compact, corrupt a byte, and compare durability overhead.",
);

const store = new ObjectStore(K.hash);
const randomLive = () => {
  const live = [...store.index.values()];
  return live[Math.floor(Math.random() * live.length)];
};

K.section("Objects");
const size = K.slider("Object size (units)", 1, 30, 6, 1);
K.button(
  "PUT object",
  () => {
    store.put(size.value);
    draw();
  },
  "primary",
);
K.button("PUT 10 random", () => {
  for (let i = 0; i < 10; i++) store.put(1 + Math.floor(Math.random() * 20));
  draw();
});
K.button("DELETE random object", () => {
  const object = randomLive();
  if (!object) return;
  store.remove(object.id);
  log.add(`DELETE ${object.id}: marked deleted, space not reclaimed yet`, "warn");
  draw();
});
K.button("Compact", () => {
  const r = store.compact();
  log.add(`compaction copied ${r.copied} live objects: ${r.before} → ${r.after} data files`, "ok");
  draw();
});
K.button(
  "Flip a bit in a random object",
  () => {
    const object = randomLive();
    if (!object) return;
    object.data = object.data.slice(0, -1) + "#"; // silent corruption: the checksum no longer matches
    log.add(`bit rot in ${object.id}`, "bad");
    draw();
  },
  "danger",
);
K.button("GET all (verify checksums)", () => {
  const corrupt = store.verifyAll();
  for (const id of corrupt)
    log.add(`GET ${id}: checksum mismatch → serve from another replica and repair`, "bad");
  log.add(`verified ${store.index.size} objects, ${corrupt.length} corrupt`, corrupt.length ? "warn" : "ok");
  draw();
});
const st = K.stats({
  objs: "Live objects",
  used: "Live units",
  alloc: "Allocated units",
  garbage: "Garbage %",
});
const cv = K.canvas(150, () => draw());

K.section("Durability overhead");
const SCHEMES = {
  "3x replication": replication(3),
  "EC 4+2": erasureCoding(4, 2),
  "EC 8+3": erasureCoding(8, 3),
  "EC 10+4": erasureCoding(10, 4),
};
const scheme = K.select("Scheme", Object.keys(SCHEMES), "3x replication", () => showDurability());
const dst = K.stats({
  raw: "Raw bytes per byte stored",
  tol: "Survives losing",
  reads: "Nodes read on repair",
});
const log = K.log(90);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  const COLUMNS = 8;
  const fileWidth = Math.min(140, (width - 10) / Math.max(4, store.files.length));
  const unit = (fileWidth - 8) / COLUMNS;
  store.files.forEach((file, i) => {
    const x = 5 + i * fileWidth;
    ctx.strokeStyle = K.color("line");
    ctx.strokeRect(x, 20, fileWidth - 8, (FILE_SIZE / COLUMNS) * 13);
    let offset = 0;
    for (const object of file) {
      ctx.fillStyle = K.color(
        object.deleted ? "line" : store.isCorrupt(object) ? "bad" : K.hash(object.id) % 6,
      );
      for (let k = 0; k < object.size; k++, offset++)
        ctx.fillRect(x + 1 + (offset % COLUMNS) * unit, 21 + Math.floor(offset / COLUMNS) * 13, unit - 1, 12);
    }
    ctx.fillStyle = K.color("muted");
    ctx.fillText(`file ${i}`, x, 14);
  });
  const u = store.usage();
  st.setAll({ objs: store.index.size, used: u.live, alloc: u.allocated });
  const garbagePercent = u.allocated ? Math.round((100 * u.garbage) / u.allocated) : 0;
  st.set("garbage", garbagePercent + "%", u.garbage > u.live ? "bad" : null);
}
function showDurability() {
  const d = SCHEMES[scheme.value];
  dst.setAll({
    raw: d.overhead.toFixed(2) + "x",
    tol: d.tolerates + " nodes",
    reads: String(d.readsToRepair),
  });
}
for (let i = 0; i < 14; i++) store.put(1 + Math.floor(Math.random() * 14));
draw();
showDurability();
