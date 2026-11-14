// Variant 2, quadtree: split a square into 4 whenever it holds too many points, so dense areas get small cells.
const MAX_DEPTH = 8;

export class QuadtreeIndex {
  constructor(points, leafCapacity) {
    this.points = points;
    this.setCapacity(leafCapacity);
  }
  setCapacity(leafCapacity) {
    this.capacity = leafCapacity;
    this.root = this.build(0, 0, 1, this.points, 0);
  }
  build(x, y, size, points, depth) {
    if (points.length <= this.capacity || depth > MAX_DEPTH) return { x, y, size, points };
    const half = size / 2;
    const children = [
      [x, y],
      [x + half, y],
      [x, y + half],
      [x + half, y + half],
    ].map(([cx, cy]) => {
      const inside = points.filter((p) => p.x >= cx && p.x < cx + half && p.y >= cy && p.y < cy + half);
      return this.build(cx, cy, half, inside, depth + 1);
    });
    return { x, y, size, children };
  }
  // contract: candidates(center, radius) -> { points, regions: [{ x, y, size }] }
  candidates(center, radius) {
    const points = [];
    const regions = [];
    const visit = (node) => {
      const outside =
        center.x + radius < node.x ||
        center.x - radius > node.x + node.size ||
        center.y + radius < node.y ||
        center.y - radius > node.y + node.size;
      if (outside) return; // prune: this square cannot contain a match
      if (node.children) return node.children.forEach(visit);
      regions.push(node);
      points.push(...node.points);
    };
    visit(this.root);
    return { points, regions };
  }
  outlines() {
    const out = [];
    const walk = (node) => {
      out.push(node);
      if (node.children) node.children.forEach(walk);
    };
    walk(this.root);
    return out;
  }
}
