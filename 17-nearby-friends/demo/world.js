// The simulated world: users with positions, velocities and mutual friendships. Positions are in [0, 1].
export function createWorld(userCount, friendsPerUser, random) {
  const users = Array.from({ length: userCount }, (_, id) => ({
    id,
    x: random(),
    y: random(),
    vx: (random() - 0.5) * 0.01,
    vy: (random() - 0.5) * 0.01,
    friends: new Set(),
    phase: Math.floor(random() * 20), // spreads updates out so they do not all fire on the same tick
  }));
  for (const user of users) {
    while (user.friends.size < Math.min(friendsPerUser, userCount - 1)) {
      const other = Math.floor(random() * userCount);
      if (other === user.id) continue;
      user.friends.add(other);
      users[other].friends.add(user.id);
    }
  }
  return users;
}

// move everyone one step, bouncing off the edges
export function moveUsers(users) {
  for (const u of users) {
    u.x = Math.min(1, Math.max(0, u.x + u.vx));
    u.y = Math.min(1, Math.max(0, u.y + u.vy));
    if (u.x <= 0 || u.x >= 1) u.vx *= -1;
    if (u.y <= 0 || u.y >= 1) u.vy *= -1;
  }
}

export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
