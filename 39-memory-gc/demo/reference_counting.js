// Collector variant 1, reference counting. Contract shared with mark_and_sweep.js: (heap) -> ids freed.
// An object dies the moment nothing points at it. Cheap and immediate, but two objects that point at each
// other keep each other's count above zero for ever.
export function referenceCount(heap, id) {
  let count = heap.objects.get(id).root ? 1 : 0;
  for (const other of heap.objects.values()) if (other.refs.has(id)) count++;
  return count;
}

export function collectByReferenceCounting(heap) {
  const freed = [];
  let foundOne = true;
  while (foundOne) {
    foundOne = false;
    for (const id of heap.ids()) {
      if (referenceCount(heap, id) > 0) continue;
      heap.free(id); // this lowers the counts of whatever it pointed at, so look again
      freed.push(id);
      foundOne = true;
    }
  }
  return freed;
}
