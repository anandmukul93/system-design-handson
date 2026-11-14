// Object storage: append-only data files, compaction, checksums, replication vs erasure coding. Edit me and press Run.
K.title(
  "Object storage",
  "Objects append into fixed-size data files. Delete, compact, corrupt a byte, and compare durability overhead.",
);

const FILE = 64; // units per data file
let files = [[]],
  objects = new Map(),
  next = 1;
const crc = (s) => K.hash(s);
K.section("Objects");
const size = K.slider("Object size (units)", 1, 30, 6, 1);
K.button("PUT object", () => put(size.value), "primary");
K.button("PUT 10 random", () => {
  for (let i = 0; i < 10; i++) put(1 + Math.floor(Math.random() * 20));
});
K.button("DELETE random object", del);
K.button("Compact", compact);
K.button("Flip a bit in a random object", corrupt, "danger");
K.button("GET all (verify checksums)", verify);
const st = K.stats({
  objs: "Live objects",
  used: "Live units",
  alloc: "Allocated units",
  garbage: "Garbage %",
});
const cv = K.canvas(150, () => draw());
K.section("Durability overhead");
const scheme = K.select("Scheme", ["3x replication", "EC 4+2", "EC 8+3", "EC 10+4"], "3x replication", () =>
  dur(),
);
const dst = K.stats({
  raw: "Raw bytes per byte stored",
  tol: "Survives losing",
  reads: "Nodes read on repair",
});
const log = K.log(90);

function put(n) {
  let f = files.at(-1);
  if (f.reduce((a, o) => a + o.n, 0) + n > FILE) {
    files.push([]);
    f = files.at(-1);
  }
  const id = "obj" + next++,
    data = id + ":" + Math.random();
  const o = { id, n, data, crc: crc(data), dead: false };
  f.push(o);
  objects.set(id, o);
  draw();
}
function del() {
  const live = [...objects.values()].filter((o) => !o.dead);
  if (!live.length) return;
  const o = live[Math.floor(Math.random() * live.length)];
  o.dead = true;
  objects.delete(o.id);
  log.add(`DELETE ${o.id}: marked deleted, space not reclaimed yet`, "warn");
  draw();
}
function compact() {
  const before = files.length,
    live = files.flat().filter((o) => !o.dead);
  files = [[]];
  objects = new Map();
  for (const o of live) {
    let f = files.at(-1);
    if (f.reduce((a, x) => a + x.n, 0) + o.n > FILE) {
      files.push([]);
      f = files.at(-1);
    }
    f.push(o);
    objects.set(o.id, o);
  }
  log.add(`compaction copied ${live.length} live objects: ${before} → ${files.length} data files`, "ok");
  draw();
}
function corrupt() {
  const live = [...objects.values()];
  if (!live.length) return;
  const o = live[Math.floor(Math.random() * live.length)];
  o.data = o.data.slice(0, -1) + "#";
  log.add(`bit rot in ${o.id}`, "bad");
  draw();
}
function verify() {
  let bad = 0;
  for (const o of objects.values())
    if (crc(o.data) !== o.crc) {
      bad++;
      log.add(`GET ${o.id}: checksum mismatch → serve from another replica and repair`, "bad");
      o.data = o.data.slice(0, -1);
      o.crc = crc(o.data);
    }
  log.add(`verified ${objects.size} objects, ${bad} corrupt`, bad ? "warn" : "ok");
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  const fw = Math.min(140, (width - 10) / Math.max(4, files.length)),
    u = ((fw - 8) / FILE) * 8;
  files.forEach((f, i) => {
    const x = 5 + i * fw;
    let off = 0;
    ctx.strokeStyle = K.color("line");
    ctx.strokeRect(x, 20, fw - 8, 104);
    for (const o of f)
      for (let k = 0; k < o.n; k++, off++) {
        const r = Math.floor(off / 8),
          c = off % 8;
        ctx.fillStyle = K.color(o.dead ? "line" : crc(o.data) !== o.crc ? "bad" : K.hash(o.id) % 6);
        ctx.fillRect(x + 1 + c * u, 21 + r * 13, u - 1, 12);
      }
    ctx.fillStyle = K.color("muted");
    ctx.fillText(`file ${i}`, x, 14);
  });
  const all = files.flat(),
    live = all.filter((o) => !o.dead).reduce((a, o) => a + o.n, 0),
    alloc = all.reduce((a, o) => a + o.n, 0);
  st.setAll({ objs: objects.size, used: live, alloc });
  st.set(
    "garbage",
    alloc ? Math.round((100 * (alloc - live)) / alloc) + "%" : "0%",
    alloc - live > live ? "bad" : null,
  );
}
function dur() {
  const m = scheme.value.match(/EC (\d+)\+(\d+)/);
  if (!m) dst.setAll({ raw: "3.0x", tol: "2 nodes", reads: "1" });
  else {
    const k = +m[1],
      p = +m[2];
    dst.setAll({ raw: ((k + p) / k).toFixed(2) + "x", tol: p + " nodes", reads: String(k) });
  }
}
for (let i = 0; i < 14; i++) put(1 + Math.floor(Math.random() * 14));
dur();
