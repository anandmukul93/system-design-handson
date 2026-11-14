// Two ways to timestamp events, compared on the same message exchange between nodes A and B.
// Wall clocks can disagree (skew). Lamport clocks only count, but never put an effect before its cause.
export function messageExchange(skewOfB) {
  // real times (ms) at which things truly happen
  const real = { aSend: 100, bReceive: 130, bSend: 140, aReceive: 170 };
  let lamportA = 0;
  let lamportB = 0;
  const events = [];

  lamportA += 1; // local event: tick
  events.push({ what: "A: send m1", real: real.aSend, wall: real.aSend, lamport: lamportA });

  lamportB = Math.max(lamportB, lamportA) + 1; // on receive: jump past the sender's timestamp
  events.push({
    what: "B: receive m1",
    real: real.bReceive,
    wall: real.bReceive + skewOfB,
    lamport: lamportB,
  });

  lamportB += 1;
  events.push({ what: "B: send m2", real: real.bSend, wall: real.bSend + skewOfB, lamport: lamportB });

  lamportA = Math.max(lamportA, lamportB) + 1;
  events.push({ what: "A: receive m2", real: real.aReceive, wall: real.aReceive, lamport: lamportA });

  // did the wall clocks claim m1 was received before it was sent?
  const wallClockInverted = events[1].wall < events[0].wall;
  return { events, wallClockInverted };
}
