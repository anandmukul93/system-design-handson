// UI only: stream sliders, a timeline of windows with the watermark, and a top-ads table.
import { ClickStream } from "./click_stream.js";
import { WindowAggregator } from "./window_aggregator.js";

K.title(
  "Ad click aggregation",
  "Clicks arrive out of order. The watermark trails the max event time; when it passes a window's end, the window closes.",
);

const WINDOW = 10;
const stream = new ClickStream(K.rng(21));
const aggregator = new WindowAggregator(WINDOW);
let now = 0;

K.section("Stream");
const rate = K.slider("Clicks / tick", 1, 30, 8, 1);
const lateness = K.slider("Max out-of-orderness (s)", 0, 30, 5, 1);
const delayedPct = K.slider("Events delayed %", 0, 50, 15, 1);
const duplicatePct = K.slider("Duplicate %", 0, 30, 5, 1);
const st = K.stats({
  wm: "Watermark",
  ev: "Event time max",
  in: "Events in",
  dup: "Duplicates dropped",
  late: "Late (side output)",
  closed: "Windows closed",
});
const cv = K.canvas(150, () => draw());
const table = K.table(["Window", "State", "Top ads (clicks)"]);
const log = K.log(80);

const label = (start) => `[${start}, ${start + WINDOW})`;
K.loop(() => {
  now++;
  for (const event of stream.emit(now, rate.value, delayedPct.value, duplicatePct.value)) {
    const outcome = aggregator.add(event, lateness.value);
    if (outcome === "late" && aggregator.counts.late % 10 === 1) {
      const start = aggregator.windowStart(event.eventTime);
      log.add(
        `event at t=${event.eventTime} arrived after window ${label(start)} closed → late output`,
        "warn",
      );
    }
  }
  const watermark = aggregator.watermark(lateness.value);
  for (const start of aggregator.advance(lateness.value))
    log.add(`watermark ${watermark} ≥ ${start + WINDOW}: window ${label(start)} emitted`, "ok");

  const c = aggregator.counts;
  st.setAll({
    wm: watermark,
    ev: aggregator.maxEventTime,
    in: c.received,
    dup: c.duplicates,
    late: c.late,
    closed: c.closed,
  });
  const newestFirst = [...aggregator.windows.keys()].sort((a, b) => b - a).slice(0, 5);
  table.set(
    newestFirst.map((start) => {
      const closed = aggregator.windows.get(start).closed;
      const top = aggregator.topAds(start, 3).map(([ad, n]) => `${ad} (${n})`);
      return [label(start), K.chip(closed ? "closed" : "open", closed ? "ok" : "warn"), top.join(", ")];
    }),
  );
  draw();
}, 1000);

function draw() {
  const { ctx, width } = cv;
  cv.clear();
  const span = 60; // seconds of event time shown
  const X = (t) => 10 + ((t - (now - span)) / span) * (width - 20);
  ctx.font = "11px system-ui";
  for (const [start, win] of aggregator.windows) {
    ctx.fillStyle = K.color(win.closed ? "c3" : "c1");
    ctx.globalAlpha = 0.25;
    ctx.fillRect(X(start), 30, X(start + WINDOW) - X(start) - 2, 80);
    ctx.globalAlpha = 1;
    ctx.fillStyle = K.color("fg");
    ctx.fillText(
      Object.values(win.counts).reduce((a, b) => a + b, 0),
      X(start) + 4,
      46,
    );
  }
  const markers = [
    [aggregator.watermark(lateness.value), "c2", "watermark", 135],
    [aggregator.maxEventTime, "c4", "max event time", 15],
  ];
  for (const [t, color, text, textY] of markers) {
    ctx.strokeStyle = K.color(color);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(X(t), 20);
    ctx.lineTo(X(t), 120);
    ctx.stroke();
    ctx.fillStyle = K.color(color);
    ctx.fillText(text, X(t) - 40, textY);
  }
}
