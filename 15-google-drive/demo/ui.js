// UI only: two editable devices and a picture of which blocks would upload.
import { splitBlocks, BlockStore } from "./blocks.js";
import { SyncServer } from "./sync_server.js";

K.title(
  "Cloud file sync",
  "A file is split into blocks. Edit it on laptop and phone: only changed blocks upload, and concurrent edits create a conflict copy.",
);

const INITIAL = "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";
const store = new BlockStore(K.hash);
const server = new SyncServer(store, INITIAL);
const devices = ["laptop", "phone"].map((name) => ({ name, baseVersion: 1, text: INITIAL }));
const totals = { uploaded: 0, full: 0, conflicts: 0 };

K.section("Devices");
const editors = {};
for (const device of devices) {
  K.note(device.name);
  const editor = (editors[device.name] = K.textarea(device.text, 3));
  editor.el.addEventListener("input", () => {
    device.text = editor.value;
    draw();
  });
  K.button(`Sync ${device.name}`, () => sync(device), "primary");
  K.button(`Pull to ${device.name}`, () => pull(device));
}
const st = K.stats({
  ver: "Server version",
  up: "Bytes uploaded",
  full: "Bytes if whole file",
  saved: "Saved by delta + dedupe",
  conf: "Conflict copies",
});
const cv = K.canvas(110, () => draw());
const log = K.log(110);

function sync(device) {
  const res = server.sync(device);
  if (res.status === "unchanged") return log.add(`${device.name}: nothing changed`, "muted");
  if (res.status === "conflict") {
    totals.conflicts++;
    log.add(
      `${device.name}: based on an older version but server is v${res.serverVersion} → saved as "notes (${device.name}'s conflicted copy)"`,
      "bad",
    );
    return pull(device, true);
  }
  totals.uploaded += res.uploadedBytes;
  totals.full += res.fileBytes;
  log.add(
    `${device.name}: uploaded ${res.uploadedBytes} of ${res.fileBytes} bytes (${res.blockCount} blocks, rest already stored) → v${server.version}`,
    "ok",
  );
  draw();
}
function pull(device, quiet) {
  server.pull(device);
  editors[device.name].value = device.text;
  if (!quiet) log.add(`${device.name} pulled v${server.version}`, "muted");
  draw();
}
function draw() {
  const { ctx, width } = cv;
  cv.clear();
  ctx.font = "11px system-ui";
  devices.forEach((device, row) => {
    const blocks = splitBlocks(device.text);
    const w = Math.min(28, (width - 70) / Math.max(1, blocks.length));
    ctx.fillStyle = K.color("fg");
    ctx.fillText(device.name, 4, 30 + row * 45);
    blocks.forEach((block, i) => {
      ctx.fillStyle = K.color(store.has(block) ? "c3" : "c2");
      ctx.fillRect(60 + i * w, 14 + row * 45, w - 2, 24);
    });
  });
  ctx.fillStyle = K.color("muted");
  ctx.fillText("green: block already in blob store (skip)   orange: new block (upload)", 4, 106);
  st.setAll({
    ver: "v" + server.version,
    up: totals.uploaded,
    full: totals.full,
    saved: totals.full ? Math.round(100 - (100 * totals.uploaded) / totals.full) + "%" : "–",
  });
  st.set("conf", totals.conflicts, totals.conflicts ? "warn" : null);
}
draw();
log.add("Try: change one word on laptop and sync. Then edit both devices and sync both.", "muted");
