// A tiny heap: objects that reference each other, some of them roots (think: variables on the stack).
export class Heap {
  constructor() {
    this.objects = new Map(); // id -> { id, refs: Set of ids, root }
    this.nextId = 0;
  }
  allocate(root = false) {
    const object = { id: this.nextId++, refs: new Set(), root };
    this.objects.set(object.id, object);
    return object;
  }
  addReference(fromId, toId) {
    const from = this.objects.get(fromId);
    if (!from || !this.objects.has(toId)) return false;
    from.refs.add(toId);
    return true;
  }
  dropRoots() {
    for (const object of this.objects.values()) object.root = false;
  }
  free(id) {
    this.objects.delete(id);
    for (const object of this.objects.values()) object.refs.delete(id);
  }
  ids() {
    return [...this.objects.keys()];
  }
}

// the starting scene: 0 → 1 → 2 hang off root 0; root 3 → 4 ⇄ 5, where 4 and 5 form a cycle
export function sampleHeap() {
  const heap = new Heap();
  const [a, b, c, d, e, f] = [true, false, false, true, false, false].map((root) => heap.allocate(root));
  heap.addReference(a.id, b.id);
  heap.addReference(b.id, c.id);
  heap.addReference(d.id, e.id);
  heap.addReference(e.id, f.id);
  heap.addReference(f.id, e.id);
  return heap;
}
