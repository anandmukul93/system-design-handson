// Head-of-line blocking: page load time for 6 streams over a lossy link, under three protocol variants.
// Same contract for each: (lostPerStream: number[], rttMs) -> load time in ms.
const PACKETS_PER_STREAM = 20;
const STREAMS = 6;
// time to send everything with no loss, sharing one connection
const baseTransfer = (rtt) => ((PACKETS_PER_STREAM * STREAMS) / 12) * (rtt / 4);

// Variant 1, HTTP/1.1: six parallel TCP connections. Loss on one does not block the others,
// but each connection pays its own handshake and the page waits for the slowest.
export function http1(lostPerStream, rtt) {
  const perConnection = lostPerStream.map((lost) => ((PACKETS_PER_STREAM / 2 + lost) * rtt) / 4);
  return 2 * rtt + Math.max(...perConnection);
}
// Variant 2, HTTP/2: all streams share ONE TCP connection. TCP delivers bytes in order,
// so every lost packet stalls all six streams for a retransmission round trip.
export function http2(lostPerStream, rtt) {
  const totalLost = lostPerStream.reduce((a, b) => a + b, 0);
  return rtt + baseTransfer(rtt) + totalLost * rtt;
}
// Variant 3, HTTP/3: streams are independent inside QUIC. A loss stalls only its own stream,
// and connection setup takes fewer round trips.
export function http3(lostPerStream, rtt) {
  return 0.5 * rtt + baseTransfer(rtt) + Math.max(...lostPerStream) * rtt;
}

// average each variant over many random loss patterns
export function compare(variants, lossPercent, rtt, random, trials = 200) {
  const totals = variants.map(() => 0);
  for (let t = 0; t < trials; t++) {
    const lostPerStream = Array.from({ length: STREAMS }, () => {
      let lost = 0;
      for (let p = 0; p < PACKETS_PER_STREAM; p++) if (random() * 100 < lossPercent) lost++;
      return lost;
    });
    variants.forEach((variant, i) => (totals[i] += variant(lostPerStream, rtt)));
  }
  return totals.map((total) => Math.round(total / trials));
}
