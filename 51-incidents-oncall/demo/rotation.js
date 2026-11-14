// A weekly on-call rotation: primary rotates through the team, secondary is the next person along,
// and overrides ({ weekNumber: name }) swap the primary for one week.
const WEEK_MS = 7 * 864e5;

// returns { weeks: [{ week, starts, primary, secondary, overridden }], primaryWeeks: { name: count } }
export function buildRotation(people, overrides, weekCount, startDate) {
  const primaryWeeks = {};
  const weeks = Array.from({ length: weekCount }, (_, i) => {
    const week = i + 1;
    const primary = overrides[week] || people[i % people.length];
    let secondary = people[(i + 1) % people.length];
    if (secondary === primary) secondary = people[(i + 2) % people.length]; // never the same person twice
    primaryWeeks[primary] = (primaryWeeks[primary] || 0) + 1;
    const starts = new Date(startDate.getTime() + i * WEEK_MS);
    return { week, starts, primary, secondary, overridden: Boolean(overrides[week]) };
  });
  return { weeks, primaryWeeks };
}

// "3:eve, 5:ana" -> { 3: "eve", 5: "ana" }
export function parseOverrides(text) {
  const overrides = {};
  for (const part of text.split(",")) {
    const [week, name] = part.split(":").map((s) => s.trim());
    if (week && name) overrides[week] = name;
  }
  return overrides;
}
