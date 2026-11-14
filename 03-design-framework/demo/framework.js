// The four-phase interview framework as data, plus a function that says which phase the clock is in.
export const SYSTEMS = [
  "URL shortener",
  "Rate limiter",
  "News feed",
  "Chat system",
  "Web crawler",
  "Notification system",
  "Search autocomplete",
  "Hotel reservation",
  "Payment system",
  "Distributed message queue",
];

// share = fraction of the interview each phase should take
export const PHASES = [
  {
    name: "Understand the problem & scope",
    share: 0.15,
    items: [
      "Who are the users and what are the core features?",
      "Scale: DAU, QPS, data size",
      "Non-functional: latency, availability, consistency",
      "What's explicitly out of scope?",
    ],
  },
  {
    name: "High-level design & buy-in",
    share: 0.3,
    items: [
      "API endpoints",
      "Data model",
      "Boxes and arrows for the main flow",
      "Walk one request end to end",
      "Back-of-envelope numbers",
    ],
  },
  {
    name: "Deep dive",
    share: 0.4,
    items: [
      "The bottleneck component",
      "Scaling: sharding, caching, replication",
      "Consistency and failure handling",
      "Trade-offs with alternatives named",
    ],
  },
  {
    name: "Wrap up",
    share: 0.15,
    items: ["Recap the design", "Failure modes and monitoring", "What you'd do next with more time"],
  },
];

// elapsed and total in seconds -> { index, secondsLeft } for the current phase
export function phaseAt(elapsed, total) {
  let start = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const end = start + PHASES[i].share * total;
    if (elapsed < end || i === PHASES.length - 1)
      return { index: i, secondsLeft: Math.max(0, end - elapsed) };
    start = end;
  }
}
