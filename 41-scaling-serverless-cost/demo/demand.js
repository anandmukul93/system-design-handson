// One day of traffic, minute by minute: quiet at night, a daytime hump, and a one-hour lunchtime spike.
export const MINUTES_PER_DAY = 1440;

export function demandAt(minute, spikeFactor, random) {
  const hour = minute / 60;
  let rps = 300 + 500 * Math.max(0, Math.sin(((hour - 6) / 18) * Math.PI));
  if (hour > 12 && hour < 13) rps *= spikeFactor;
  return rps * (0.95 + random() * 0.1);
}
