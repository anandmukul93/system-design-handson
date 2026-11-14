// UI only: three generators sharing one simulated clock, a duplicate detector and a bit diagram.
import { Snowflake, LAYOUT, decode } from "./snowflake.js";

K.title(
  "Snowflake ID generator",
  "64-bit IDs = timestamp | datacenter | machine | sequence. Overflow the sequence or move a clock backwards.",
);

const clock = {
  ms: Date.now(),
  now() {
    return this.ms;
  },
  advance(ms) {
    this.ms += ms;
  },
};
const generators = [new Snowflake(1, 1, clock), new Snowflake(1, 2, clock), new Snowflake(2, 1, clock)];
const seen = new Set();
let duplicates = 0;
let generated = 0;
let latest = [];

K.section("Generate");
const machine = K.select(
  "Machine",
  generators.map((g, i) => ({ value: i, label: `dc ${g.datacenter} / machine ${g.machine}` })),
  0,
);
const burst = K.slider("IDs per click", 1, 10000, 1, 1);
K.button("Generate", () => generate(Number(machine.value), burst.value), "primary");
K.button(
  "Clock back 5 ms on this machine",
  () => {
    generators[Number(machine.value)].skewMs -= 5;
    log.add(`machine ${machine.value}: clock moved back 5 ms`, "warn");
  },
  "danger",
);
K.button(
  "Give machine 2 the same id as machine 1",
  () => {
    generators[1].machine = generators[0].machine;
    generators[1].datacenter = generators[0].datacenter;
    log.add("Misconfiguration: two machines share dc/machine id", "bad");
  },
  "danger",
);
const st = K.stats({
  total: "IDs generated",
  dupes: "Duplicates",
  waits: "Spins waiting for next ms",
  rate: "Max IDs / ms / machine",
});
st.set("rate", "4096");

K.section("Anatomy of the last ID");
const bits = K.canvas(90, () => drawBits());
const table = K.table(["ID", "timestamp (ms since epoch)", "datacenter", "machine", "sequence"]);
const log = K.log(90);

function generate(index, count) {
  const g = generators[index];
  try {
    for (let k = 0; k < count; k++) {
      const id = g.next();
      generated++;
      if (seen.has(id)) duplicates++;
      else seen.add(id);
      latest.unshift(id);
      if (latest.length > 8) latest.pop();
    }
    if (count > 4096)
      log.add(
        `${count} IDs in one burst: sequence overflowed ${Math.floor(count / 4096)} times, generator waited for the next ms`,
        "warn",
      );
  } catch (e) {
    log.add(`machine ${index}: ${e.message}. Refusing to generate (would risk duplicates).`, "bad");
  }
  st.setAll({ total: generated, waits: generators.reduce((a, x) => a + x.waits, 0) });
  st.set("dupes", duplicates, duplicates ? "bad" : "ok");
  table.set(
    latest.map((id) => {
      const d = decode(id);
      return [id, d.timestamp, d.datacenter, d.machine, d.sequence].map(String);
    }),
  );
  drawBits();
}
function drawBits() {
  const { ctx, width } = bits;
  bits.clear();
  const id = latest[0] ?? 0n;
  const colors = ["muted", "c1", "c2", "c3", "c4"];
  const bitWidth = (width - 10) / 64;
  let x = 5;
  let bit = 63;
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "center";
  LAYOUT.forEach(([name, size], part) => {
    for (let i = 0; i < size; i++, bit--) {
      ctx.fillStyle = K.color(colors[part]);
      ctx.globalAlpha = (id >> BigInt(bit)) & 1n ? 0.95 : 0.25;
      ctx.fillRect(x + 0.5, 10, bitWidth - 1, 26);
      x += bitWidth;
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(`${name} (${size})`, x - (size * bitWidth) / 2, 55);
  });
  ctx.textAlign = "start";
}
K.loop(() => clock.advance(100), 100);
generate(0, 1);
