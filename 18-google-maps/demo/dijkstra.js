// Variant 1, Dijkstra: no heuristic, so the frontier grows evenly in every direction.
import { shortestPath } from "./search.js";

// contract: route(map, startIndex, goalIndex) -> { explored, exploredCount, path, eta }
export function dijkstra(map, start, goal) {
  return shortestPath(map, start, goal, () => 0);
}
