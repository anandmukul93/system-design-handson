// Block-level sync with dedupe and conflict copies. Edit me and press Run.
K.title("Cloud file sync", "A file is split into blocks. Edit it on laptop and phone: only changed blocks upload, and concurrent edits create a conflict copy.");

const BLOCK = 8;                                  // characters per block (4 MB in real life)
const blocks = (s) => s.match(new RegExp(`[\\s\\S]{1,${BLOCK}}`, "g")) || [];
const blobStore = new Set();
let server = { version: 1, text: "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs." };
blocks(server.text).forEach((b) => blobStore.add(K.hash(b)));
const devices = { laptop: { base: 1, text: server.text }, phone: { base: 1, text: server.text } };
let uploaded = 0, total = 0, conflicts = 0;

K.section("Devices");
const ed = {};
for (const d of Object.keys(devices)) { K.note(d); ed[d] = K.textarea(devices[d].text, 3); ed[d].el.addEventListener("input", () => { devices[d].text = ed[d].value; draw(); }); K.button(`Sync ${d}`, () => sync(d), "primary"); K.button(`Pull to ${d}`, () => pull(d)); }
const st = K.stats({ ver: "Server version", up: "Bytes uploaded", full: "Bytes if whole file", saved: "Saved by delta + dedupe", conf: "Conflict copies" });
const cv = K.canvas(110, () => draw());
const log = K.log(110);

function sync(d) {
  const dev = devices[d];
  if (dev.text === server.text) return log.add(`${d}: nothing changed`, "muted");
  if (dev.base !== server.version) {                       // someone else synced first
    conflicts++;
    log.add(`${d}: base v${dev.base} but server is v${server.version} → saved as "notes (${d}'s conflicted copy)"`, "bad");
    dev.text = server.text; dev.base = server.version; ed[d].value = dev.text; return draw();
  }
  let bytes = 0;
  for (const b of blocks(dev.text)) { const h = K.hash(b); if (!blobStore.has(h)) { blobStore.add(h); bytes += b.length; } }
  uploaded += bytes; total += dev.text.length;
  server = { version: server.version + 1, text: dev.text }; dev.base = server.version;
  log.add(`${d}: uploaded ${bytes} of ${dev.text.length} bytes (${blocks(dev.text).length} blocks, rest already stored) → v${server.version}`, "ok");
  draw();
}
function pull(d) { devices[d].text = server.text; devices[d].base = server.version; ed[d].value = server.text; log.add(`${d} pulled v${server.version}`, "muted"); draw(); }
function draw() {
  const { ctx, width } = cv; cv.clear();
  ctx.font = "11px system-ui";
  Object.keys(devices).forEach((d, row) => {
    const bs = blocks(devices[d].text), w = Math.min(28, (width - 70) / Math.max(1, bs.length));
    ctx.fillStyle = K.color("fg"); ctx.fillText(d, 4, 30 + row * 45);
    bs.forEach((b, i) => {
      const stored = blobStore.has(K.hash(b));
      ctx.fillStyle = K.color(stored ? "c3" : "c2"); ctx.fillRect(60 + i * w, 14 + row * 45, w - 2, 24);
    });
  });
  ctx.fillStyle = K.color("muted"); ctx.fillText("green: block already in blob store (skip)   orange: new block (upload)", 4, 106);
  st.setAll({ ver: "v" + server.version, up: uploaded, full: total, saved: total ? Math.round(100 - (100 * uploaded) / total) + "%" : "–" });
  st.set("conf", conflicts, conflicts ? "warn" : null);
}
draw();
log.add("Try: change one word on laptop and sync. Then edit both devices and sync both.", "muted");
