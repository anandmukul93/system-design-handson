// Collector variant 2, mark-and-sweep (a tracing collector). Same contract: (heap) -> ids freed.
// Start at the roots, mark everything reachable, free the rest. Cycles are no problem, but the collector
// has to walk the whole live graph, which is where GC pauses come from.
export function mark(heap) {
  const marked = new Set();
  const stack = heap.ids().filter((id) => heap.objects.get(id).root);
  while (stack.length) {
    const id = stack.pop();
    if (marked.has(id)) continue;
    marked.add(id);
    stack.push(...heap.objects.get(id).refs);
  }
  return marked;
}

export function collectByMarkAndSweep(heap) {
  const marked = mark(heap);
  const freed = heap.ids().filter((id) => !marked.has(id));
  for (const id of freed) heap.free(id);
  return freed;
}
