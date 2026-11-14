// Capacity estimate: assumptions in, QPS / storage / bandwidth / server count out. Pure arithmetic.
const SECONDS_PER_DAY = 86400;

// assumptions: { dauMillions, writesPerUser, readsPerWrite, textKB, mediaPercent, mediaMB, years, peakFactor }
export function estimate(a) {
  const users = a.dauMillions * 1e6;
  const writesPerDay = users * a.writesPerUser;
  const writeQps = writesPerDay / SECONDS_PER_DAY;
  const readQps = writeQps * a.readsPerWrite;
  const bytesPerWrite = a.textKB * 1e3 + (a.mediaPercent / 100) * a.mediaMB * 1e6;
  const storagePerDay = writesPerDay * bytesPerWrite;
  return {
    users,
    writesPerDay,
    writeQps,
    writeQpsPeak: writeQps * a.peakFactor,
    readQps,
    readQpsPeak: readQps * a.peakFactor,
    bytesPerWrite,
    storagePerDay,
    storageTotal: storagePerDay * 365 * a.years,
    egressBytesPerSecond: readQps * bytesPerWrite,
    servers: Math.ceil(((writeQps + readQps) * a.peakFactor) / 1000), // at 1k QPS per app server
  };
}
