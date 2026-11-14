// Snowflake IDs from several machines. Edit me and press Run.
K.title("Snowflake ID generator", "64-bit IDs = timestamp | datacenter | machine | sequence. Overflow the sequence or move a clock backwards.");

const EPOCH = 1288834974657n;
class Snowflake {
  constructor(dc, m) { this.dc = BigInt(dc); this.m = BigInt(m); this.last = -1n; this.seq = 0n; this.skew = 0; this.waits = 0; }
  now() { return BigInt(Math.floor(simNow + this.skew)); }
  next() {
    let t = this.now();
    if (t < this.last) throw new Error(`clock moved backwards by ${this.last - t} ms`);
    if (t === this.last) {
      this.seq = (this.seq + 1n) & 4095n;
      if (this.seq === 0n) { while (t <= this.last) { simNow += 0.05; t = this.now(); this.waits++; } }
    } else this.seq = 0n;
    this.last = t;
    return ((t - EPOCH) << 22n) | (this.dc << 17n) | (this.m << 12n) | this.seq;
  }
}
let simNow = Date.now();
const gens = [new Snowflake(1, 1), new Snowflake(1, 2), new Snowflake(2, 1)];
const seen = new Set();
let dupes = 0, generated = 0;

K.section("Generate");
const machine = K.select("Machine", gens.map((g, i) => ({ value: i, label: `dc ${g.dc} / machine ${g.m}` })), 0);
const burst = K.slider("IDs per click", 1, 10000, 1, 1);
K.button("Generate", () => gen(Number(machine.value), burst.value), "primary");
K.button("Clock back 5 ms on this machine", () => { gens[Number(machine.value)].skew -= 5; log.add(`machine ${machine.value}: clock moved back 5 ms`, "warn"); }, "danger");
K.button("Give machine 2 the same id as machine 1", () => { gens[1].m = gens[0].m; gens[1].dc = gens[0].dc; log.add("Misconfiguration: two machines share dc/machine id", "bad"); }, "danger");
const st = K.stats({ total: "IDs generated", dupes: "Duplicates", waits: "Spins waiting for next ms", rate: "Max IDs / ms / machine" });
st.set("rate", "4096");

K.section("Anatomy of the last ID");
const bits = K.canvas(90, () => drawBits());
const table = K.table(["ID", "timestamp (ms since epoch)", "datacenter", "machine", "sequence"]);
const log = K.log(90);
let last = [];

function gen(i, n) {
  const g = gens[i];
  try {
    for (let k = 0; k < n; k++) {
      const id = g.next();
      generated++;
      if (seen.has(id)) dupes++; else seen.add(id);
      last.unshift(id); if (last.length > 8) last.pop();
    }
    if (n > 4096) log.add(`${n} IDs in one burst: sequence overflowed ${Math.floor(n / 4096)} times, generator waited for the next ms`, "warn");
  } catch (e) { log.add(`machine ${i}: ${e.message}. Refusing to generate (would risk duplicates).`, "bad"); }
  st.setAll({ total: generated, waits: gens.reduce((a, g) => a + g.waits, 0) });
  st.set("dupes", dupes, dupes ? "bad" : "ok");
  table.set(last.map((id) => [id.toString(), ((id >> 22n) + EPOCH).toString(), (id >> 17n) & 31n, (id >> 12n) & 31n, id & 4095n].map(String)));
  drawBits();
}
function drawBits() {
  const { ctx, width } = bits; bits.clear();
  const id = last[0] ?? 0n, parts = [["sign", 1, "muted"], ["timestamp", 41, "c1"], ["dc", 5, "c2"], ["machine", 5, "c3"], ["sequence", 12, "c4"]];
  const bw = (width - 10) / 64; let x = 5, bit = 63;
  ctx.font = "10px ui-monospace, monospace"; ctx.textAlign = "center";
  for (const [name, n, col] of parts) {
    for (let i = 0; i < n; i++, bit--) {
      ctx.fillStyle = K.color(col); ctx.globalAlpha = (id >> BigInt(bit)) & 1n ? 0.95 : 0.25;
      ctx.fillRect(x + 0.5, 10, bw - 1, 26); x += bw;
    }
    ctx.globalAlpha = 1; ctx.fillStyle = K.color("fg");
    ctx.fillText(`${name} (${n})`, x - (n * bw) / 2, 55);
  }
  ctx.textAlign = "start";
}
K.loop(() => { simNow += 100; }, 100);
gen(0, 1);
