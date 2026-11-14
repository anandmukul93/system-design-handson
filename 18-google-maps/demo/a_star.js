// Variant 2, A*: adds the Manhattan distance to the goal, so the search is pulled towards it.
import { shortestPath } from "./search.js";

// contract: route(map, startIndex, goalIndex) -> { explored, exploredCount, path, eta }
export function aStar(map, start, goal) {
  const gx = goal % map.width;
  const gy = Math.floor(goal / map.width);
  const manhattan = (i) => Math.abs((i % map.width) - gx) + Math.abs(Math.floor(i / map.width) - gy);
  return shortestPath(map, start, goal, manhattan);
}
