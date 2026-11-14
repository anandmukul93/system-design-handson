// Semantic versions and ranges. ^1.4.0 = same major, at least 1.4.0. ~1.4.0 = same major and minor.
export function compareVersions(a, b) {
  const x = a.split(".").map(Number);
  const y = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

export function satisfies(version, range) {
  if (range === "*") return true;
  const base = range.replace(/^[\^~]/, "");
  const [baseMajor, baseMinor] = base.split(".").map(Number);
  const [major, minor] = version.split(".").map(Number);
  if (compareVersions(version, base) < 0) return false;
  if (range[0] === "^") return major === baseMajor;
  if (range[0] === "~") return major === baseMajor && minor === baseMinor;
  return compareVersions(version, base) === 0; // exact version
}
