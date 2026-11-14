// Radius search on top of any index: ask the index for candidates, then filter by exact distance.
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// index is anything with candidates(center, radius) -> { points, regions }
export function searchNearby(index, allPoints, center, radius) {
  const { points, regions } = index.candidates(center, radius);
  const found = points.filter((p) => distance(p, center) <= radius);
  const truth = allPoints.filter((p) => distance(p, center) <= radius).length; // brute force, to spot misses
  return { scanned: points.length, found, regions, truth };
}
