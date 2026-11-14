// Lost updates: many threads do counter = counter + 1. That is two steps (read, then write), and a
// scheduler can switch threads between them. Two variants, same contract: (thread, shared) -> finished one increment?
// Variant 1, no lock: read into a private register on one turn, write back on the next.
export function unsafeIncrement(thread, shared) {
  if (thread.register === null) {
    thread.register = shared.counter; // read
    return false;
  }
  shared.counter = thread.register + 1; // write: may overwrite what other threads wrote in between
  thread.register = null;
  return true;
}
// Variant 2, with a lock: read and write happen in one turn, nobody can get in between.
export function lockedIncrement(thread, shared) {
  shared.counter++;
  return true;
}

// a preemptive scheduler: pick a random thread each turn and let it run one step
export function runThreads(threadCount, incrementsEach, increment, random) {
  const shared = { counter: 0 };
  const threads = Array.from({ length: threadCount }, () => ({ remaining: incrementsEach, register: null }));
  let running = threads;
  while (running.length) {
    const thread = running[Math.floor(random() * running.length)];
    if (increment(thread, shared)) thread.remaining--;
    if (!thread.remaining) running = running.filter((t) => t.remaining);
  }
  return { expected: threadCount * incrementsEach, actual: shared.counter };
}
