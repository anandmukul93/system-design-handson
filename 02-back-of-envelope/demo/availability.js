// Availability maths: serial dependencies multiply, and "nines" translate into downtime.
const SECONDS_PER_YEAR = 365 * 86400;

// every request needs all `dependencies` components, each available `percent` of the time
export function combinedAvailability(percent, dependencies) {
  return Math.pow(percent / 100, dependencies);
}

// availability as a fraction (0.999) -> { perYear, perMonth } in seconds
export function downtime(availability) {
  const perYear = (1 - availability) * SECONDS_PER_YEAR;
  return { perYear, perMonth: perYear / 12 };
}
