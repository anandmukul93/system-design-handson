// A 45-minute mock interview coach. Edit me and press Run.
K.title("Mock interview coach", "Pick a system, start the clock, and tick off what you covered in each phase.");

const SYSTEMS = ["URL shortener", "Rate limiter", "News feed", "Chat system", "Web crawler", "Notification system", "Search autocomplete", "Hotel reservation", "Payment system", "Distributed message queue"];
const PHASES = [
  { name: "Understand the problem & scope", share: 0.15, items: ["Who are the users and what are the core features?", "Scale: DAU, QPS, data size", "Non-functional: latency, availability, consistency", "What's explicitly out of scope?"] },
  { name: "High-level design & buy-in", share: 0.30, items: ["API endpoints", "Data model", "Boxes and arrows for the main flow", "Walk one request end to end", "Back-of-envelope numbers"] },
  { name: "Deep dive", share: 0.40, items: ["The bottleneck component", "Scaling: sharding, caching, replication", "Consistency and failure handling", "Trade-offs with alternatives named"] },
  { name: "Wrap up", share: 0.15, items: ["Recap the design", "Failure modes and monitoring", "What you'd do next with more time"] },
];
K.section("Setup");
const sys = K.select("System", SYSTEMS, SYSTEMS[0]);
const total = K.slider("Interview length (minutes)", 15, 60, 45, 5);
const speed = K.select("Clock speed", [{ value: 1, label: "real time" }, { value: 10, label: "10x (practice the flow)" }, { value: 60, label: "60x (preview)" }], 1);
K.button("Start", start, "primary");
K.button("Stop", () => { clock && clock.stop(); });

K.section("Clock");
const st = K.stats({ phase: "Current phase", left: "Time left in phase", total: "Total elapsed", score: "Checklist covered" });
const bars = K.bars(120);
K.section("Checklist (tick as you go)");
const boxes = [];
PHASES.forEach((p, i) => {
  K.note(`${i + 1}. ${p.name}`);
  p.items.forEach((it) => boxes.push(K.toggle(it, false, score)));
});
const log = K.log(80);

let elapsed = 0, clock = null;
function score() {
  const n = boxes.filter((b) => b.value).length;
  st.set("score", `${n} / ${boxes.length}`, n === boxes.length ? "ok" : null);
}
function start() {
  elapsed = 0; boxes.forEach((b) => (b.value = false)); score(); log.clear();
  log.add(`Design a ${sys.value}. Go.`, "ok");
  clock && clock.stop();
  let lastPhase = -1;
  clock = K.loop(() => {
    elapsed += 0.25 * Number(speed.value);
    const T = total.value * 60;
    let acc = 0, idx = PHASES.length - 1;
    for (let i = 0; i < PHASES.length; i++) { if (elapsed < acc + PHASES[i].share * T) { idx = i; break; } acc += PHASES[i].share * T; }
    if (idx !== lastPhase) { log.add(`→ ${PHASES[idx].name}`, "warn"); lastPhase = idx; }
    const left = Math.max(0, acc + PHASES[idx].share * T - elapsed);
    st.set("phase", `${idx + 1}. ${PHASES[idx].name.split(" ")[0]}`);
    st.set("left", `${Math.floor(left / 60)}:${String(Math.floor(left % 60)).padStart(2, "0")}`, left < 60 ? "bad" : null);
    st.set("total", `${Math.floor(elapsed / 60)} min`);
    bars.draw(PHASES.map((p, i) => ({ label: p.name.split(" ")[0], value: Math.round(p.share * total.value), color: i === idx ? "c2" : "c1" })));
    if (elapsed >= T) { clock.stop(); log.add("Time! Note what you missed in MISTAKES.md.", "bad"); }
  }, 250);
}
bars.draw(PHASES.map((p) => ({ label: p.name.split(" ")[0], value: Math.round(p.share * 45), color: "c1" })));
score();
