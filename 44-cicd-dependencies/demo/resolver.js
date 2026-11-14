// Dependency resolution: pick ONE version of every package that satisfies every range asked of it,
// including ranges that come from other packages' own dependencies.
// returns { chosen: { package: version } } or { conflict: { package, constraints, available } }
import { compareVersions, satisfies } from "./semver.js";

export function resolve(requirements, registry) {
  const constraints = {}; // package -> [{ range, from }]
  const require = (name, range, from) => {
    constraints[name] ??= [];
    if (!constraints[name].some((c) => c.from === from)) constraints[name].push({ range, from });
  };
  for (const [name, range] of requirements) require(name, range, "your project");

  const chosen = {};
  // picking a version adds its dependencies as new constraints, so repeat until nothing changes
  for (let changed = true, rounds = 0; changed && rounds < 10; rounds++) {
    changed = false;
    for (const name of Object.keys(constraints)) {
      const available = Object.keys(registry[name] || {});
      const candidates = available.filter((v) => constraints[name].every((c) => satisfies(v, c.range)));
      if (!candidates.length)
        return { conflict: { package: name, constraints: constraints[name], available } };
      const newest = candidates.sort(compareVersions).pop();
      if (chosen[name] === newest) continue;
      chosen[name] = newest;
      changed = true;
      for (const [dependency, range] of Object.entries(registry[name][newest]))
        require(dependency, range, `${name}@${newest}`);
    }
  }
  return { chosen };
}

// "web-kit ^2.0.0\nauth-sdk ^1.0.0" -> [["web-kit", "^2.0.0"], ["auth-sdk", "^1.0.0"]]
export function parseRequirements(text) {
  return text
    .split("\n")
    .map((line) => line.trim().split(/\s+/))
    .filter(([name, range]) => name && range);
}
