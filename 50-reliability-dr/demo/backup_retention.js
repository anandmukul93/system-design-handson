// Grandfather-father-son retention: keep the last 7 daily backups, 4 weekly (Sundays) and 12 monthly (1st).
const DAY_MS = 864e5;
const isoDate = (date) => date.toISOString().slice(0, 10);

// returns { taken, kept: [iso dates, newest first] }
export function backupsToKeep(today, days, { daily = 7, weekly = 4, monthly = 12 } = {}) {
  const dates = Array.from({ length: days }, (_, i) => new Date(today.getTime() - i * DAY_MS)); // newest first
  const kept = new Set(
    [
      ...dates.slice(0, daily),
      ...dates.filter((d) => d.getUTCDay() === 0).slice(0, weekly),
      ...dates.filter((d) => d.getUTCDate() === 1).slice(0, monthly),
    ].map(isoDate),
  );
  return { taken: dates.length, kept: [...kept].sort().reverse() };
}
