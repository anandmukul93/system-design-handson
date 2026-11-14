// Variant 1, geohash-style grid: cut the map into equal cells and scan the query's cell plus its 8 neighbours.
// Points are { x, y } with both in [0, 1).
export class GridIndex {
  constructor(points, bitsPerAxis) {
    this.points = points;
    this.setPrecision(bitsPerAxis);
  }
  setPrecision(bitsPerAxis) {
    this.cellsPerAxis = 2 ** bitsPerAxis;
    this.cells = new Map(); // "cx,cy" -> points
    for (const p of this.points) {
      const key = this.cellOf(p).join(",");
      if (!this.cells.has(key)) this.cells.set(key, []);
      this.cells.get(key).push(p);
    }
  }
  cellOf(p) {
    return [Math.floor(p.x * this.cellsPerAxis), Math.floor(p.y * this.cellsPerAxis)];
  }
  // contract: candidates(center, radius) -> { points, regions: [{ x, y, size }] }
  // the radius is ignored on purpose: a fixed grid always scans 9 cells, whatever you ask for
  candidates(center) {
    const [cx, cy] = this.cellOf(center);
    const n = this.cellsPerAxis;
    const points = [];
    const regions = [];
    for (let dx = -1; dx <= 1; dx++)
      for (let dy = -1; dy <= 1; dy++) {
        const gx = cx + dx;
        const gy = cy + dy;
        if (gx < 0 || gy < 0 || gx >= n || gy >= n) continue;
        regions.push({ x: gx / n, y: gy / n, size: 1 / n });
        points.push(...(this.cells.get(gx + "," + gy) || []));
      }
    return { points, regions };
  }
  // all cell outlines, for drawing
  outlines() {
    const n = this.cellsPerAxis;
    const out = [];
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push({ x: i / n, y: j / n, size: 1 / n });
    return out;
  }
}
