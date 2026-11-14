// A random social graph with a few celebrities that almost everyone follows.
export function buildGraph(userCount, celebrities, random) {
  const followers = Array.from({ length: userCount }, () => new Set());
  const following = Array.from({ length: userCount }, () => new Set());
  const follow = (a, b) => {
    if (a === b) return;
    followers[b].add(a);
    following[a].add(b);
  };
  for (let u = 0; u < userCount; u++) {
    for (const c of celebrities) if (random() < 0.9) follow(u, c);
    for (let k = 0; k < 8; k++) follow(u, Math.floor(random() * userCount));
  }
  return { userCount, celebrities, followers, following };
}
