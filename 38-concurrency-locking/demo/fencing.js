// A distributed lock is a lease, and a paused client cannot tell that its lease ran out.
// Fix: the lock service hands out an increasing token with each lease, and storage refuses older tokens.
export class Storage {
  constructor(checkFencingToken) {
    this.checkFencingToken = checkFencingToken;
    this.highestToken = 0;
    this.writes = [];
  }
  // returns true if accepted
  write(token, value) {
    if (this.checkFencingToken && token < this.highestToken) return false;
    this.highestToken = Math.max(this.highestToken, token);
    this.writes.push(value);
    return true;
  }
}

// client A pauses while holding the lock; B takes over; A wakes up and writes anyway. returns [{ text, kind }]
export function gcPauseScenario(checkFencingToken) {
  const storage = new Storage(checkFencingToken);
  const steps = [];
  const say = (text, kind = "muted") => steps.push({ text, kind });
  const write = (client, token, value) => {
    if (!storage.write(token, value))
      return say(`storage rejects ${client}'s write: token ${token} < ${storage.highestToken}`, "ok");
    say(`storage accepts ${client}: "${value}" (token ${token})`, storage.writes.length > 1 ? "bad" : "ok");
  };
  say("t=0  client A acquires lease (10 s), token 33");
  say("t=1  client A stops for a 15 s GC pause", "warn");
  say("t=10 lease expires; client B acquires it, token 34");
  write("B", 34, "B's update");
  say("t=16 client A wakes up, still believes it holds the lock", "warn");
  write("A", 33, "A's stale update");
  if (storage.writes.length > 1) say("both clients wrote while 'holding' the lock: data corrupted", "bad");
  return steps;
}
