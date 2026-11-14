// UI only: a clock, a phase bar chart and a checklist driven by framework.js.
import { SYSTEMS, PHASES, phaseAt } from "./framework.js";

K.title(
  "Mock interview coach",
  "Pick a system, start the clock, and tick off what you covered in each phase.",
);

K.section("Setup");
const sys = K.select("System", SYSTEMS, SYSTEMS[0]);
const total = K.slider("Interview length (minutes)", 15, 60, 45, 5);
const speed = K.select(
  "Clock speed",
  [
    { value: 1, label: "real time" },
    { value: 10, label: "10x (practice the flow)" },
    { value: 60, label: "60x (preview)" },
  ],
  1,
);
K.button("Start", start, "primary");
K.button("Stop", () => {
  clock && clock.stop();
});

K.section("Clock");
const st = K.stats({
  phase: "Current phase",
  left: "Time left in phase",
  total: "Total elapsed",
  score: "Checklist covered",
});
const bars = K.bars(120);
K.section("Checklist (tick as you go)");
const boxes = [];
PHASES.forEach((p, i) => {
  K.note(`${i + 1}. ${p.name}`);
  p.items.forEach((item) => boxes.push(K.toggle(item, false, score)));
});
const log = K.log(80);

const shortName = (p) => p.name.split(" ")[0];
const drawBars = (minutes, current) =>
  bars.draw(
    PHASES.map((p, i) => ({
      label: shortName(p),
      value: Math.round(p.share * minutes),
      color: i === current ? "c2" : "c1",
    })),
  );

let elapsed = 0;
let clock = null;
function score() {
  const n = boxes.filter((b) => b.value).length;
  st.set("score", `${n} / ${boxes.length}`, n === boxes.length ? "ok" : null);
}
function start() {
  elapsed = 0;
  boxes.forEach((b) => (b.value = false));
  score();
  log.clear();
  log.add(`Design a ${sys.value}. Go.`, "ok");
  clock && clock.stop();
  let lastPhase = -1;
  clock = K.loop(() => {
    elapsed += 0.25 * Number(speed.value);
    const totalSeconds = total.value * 60;
    const { index, secondsLeft } = phaseAt(elapsed, totalSeconds);
    if (index !== lastPhase) {
      log.add(`→ ${PHASES[index].name}`, "warn");
      lastPhase = index;
    }
    const mm = Math.floor(secondsLeft / 60);
    const ss = String(Math.floor(secondsLeft % 60)).padStart(2, "0");
    st.set("phase", `${index + 1}. ${shortName(PHASES[index])}`);
    st.set("left", `${mm}:${ss}`, secondsLeft < 60 ? "bad" : null);
    st.set("total", `${Math.floor(elapsed / 60)} min`);
    drawBars(total.value, index);
    if (elapsed >= totalSeconds) {
      clock.stop();
      log.add("Time! Note what you missed in MISTAKES.md.", "bad");
    }
  }, 250);
}
drawBars(45, -1);
score();
