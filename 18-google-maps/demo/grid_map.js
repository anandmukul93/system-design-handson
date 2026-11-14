// The road network: a grid where each cell can be a wall or have a travel cost (traffic makes a cell slower).
export class GridMap {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.wall = new Uint8Array(width * height);
    this.cost = new Float32Array(width * height).fill(1);
  }
  index(x, y) {
    return y * this.width + x;
  }
  inside(x, y) {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }
  clear() {
    this.wall.fill(0);
    this.cost.fill(1);
  }
  // open neighbours (up, down, left, right) of cell index i
  neighbours(i) {
    const x = i % this.width;
    const y = Math.floor(i / this.width);
    const out = [];
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      if (!this.inside(x + dx, y + dy)) continue;
      const j = this.index(x + dx, y + dy);
      if (!this.wall[j]) out.push(j);
    }
    return out;
  }
}
