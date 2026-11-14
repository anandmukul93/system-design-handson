// Adaptive bitrate player: measures throughput, picks a rendition, and tracks the playback buffer.
export const LADDER = [
  { name: "240p", kbps: 400 },
  { name: "480p", kbps: 1200 },
  { name: "720p", kbps: 2800 },
  { name: "1080p", kbps: 5000 },
];
const SAFETY = 0.8; // only use 80% of measured throughput
const LOW_BUFFER_SECONDS = 2;
const MAX_BUFFER_SECONDS = 30;

// throughput-based rule with a buffer guard: never switch UP while the buffer is nearly empty
export function chooseRendition(throughputKbps, bufferSeconds, current) {
  let wanted = 0;
  LADDER.forEach((rung, i) => {
    if (rung.kbps < throughputKbps * SAFETY) wanted = i;
  });
  return bufferSeconds < LOW_BUFFER_SECONDS ? Math.min(wanted, current) : wanted;
}

export class Player {
  constructor() {
    this.rendition = 0;
    this.buffer = 0;
    this.stalls = 0;
    this.switches = 0;
  }
  // dt seconds of playback at the given throughput. Returns { switchedFrom } when the rendition changed.
  step(throughputKbps, dt) {
    const previous = this.rendition;
    this.rendition = chooseRendition(throughputKbps, this.buffer, previous);
    if (this.rendition !== previous) this.switches++;
    // we download (throughput / bitrate) seconds of video per second, and play 1 second per second
    this.buffer += (throughputKbps / LADDER[this.rendition].kbps) * dt - dt;
    if (this.buffer < 0) {
      this.buffer = 0;
      this.stalls++;
    }
    this.buffer = Math.min(this.buffer, MAX_BUFFER_SECONDS);
    return this.rendition !== previous ? { switchedFrom: previous } : {};
  }
}
