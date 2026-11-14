// Best-first search shared by both algorithms. The only difference between Dijkstra and A* is the heuristic.
// heuristic(cellIndex) -> estimated remaining cost (must never overestimate, or the route may not be optimal)
export function shortestPath(map, start, goal, heuristic) {
  const size = map.width * map.height;
  const dist = new Float32Array(size).fill(Infinity);
  const previous = new Int32Array(size).fill(-1);
  const explored = new Uint8Array(size);
  dist[start] = 0;
  const open = [[heuristic(start), start]]; // [priority, cell]; a plain array is fine at this size
  let exploredCount = 0;

  while (open.length) {
    let best = 0;
    for (let k = 1; k < open.length; k++) if (open[k][0] < open[best][0]) best = k;
    const [, cell] = open.splice(best, 1)[0];
    if (explored[cell]) continue;
    explored[cell] = 1;
    exploredCount++;
    if (cell === goal) break;
    for (const next of map.neighbours(cell)) {
      const candidate = dist[cell] + map.cost[next];
      if (candidate < dist[next]) {
        dist[next] = candidate;
        previous[next] = cell;
        open.push([candidate + heuristic(next), next]);
      }
    }
  }

  const path = [];
  for (let c = goal; c !== -1; c = previous[c]) path.push(c);
  const reached = path[path.length - 1] === start;
  return { explored, exploredCount, path: reached ? path : [], eta: dist[goal] };
}
