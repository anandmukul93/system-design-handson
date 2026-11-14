// Dining philosophers: five threads, five locks (forks), each thread needs the two next to it.
// If everyone takes their left fork first, all can end up holding one and waiting for the next: deadlock.
// Lock ordering (always take the lower-numbered fork first) makes a cycle impossible.
export class Table {
  constructor(seats, random, lockOrdering) {
    this.random = random;
    this.lockOrdering = lockOrdering;
    this.forks = Array(seats).fill(null); // fork -> philosopher holding it
    this.philosophers = Array.from({ length: seats }, () => ({ state: "thinking", timer: 0, holding: [] }));
    this.meals = 0;
  }
  // which fork a philosopher picks up first and second
  forkOrder(seat) {
    const left = seat;
    const right = (seat + 1) % this.forks.length;
    return this.lockOrdering ? [Math.min(left, right), Math.max(left, right)] : [left, right];
  }
  take(fork, seat) {
    if (this.forks[fork] !== null) return false;
    this.forks[fork] = seat;
    this.philosophers[seat].holding.push(fork);
    return true;
  }
  step() {
    this.philosophers.forEach((p, seat) => {
      const [first, second] = this.forkOrder(seat);
      if (p.state === "thinking") {
        if (--p.timer <= 0) p.state = "hungry";
      } else if (p.state === "hungry") {
        if (!p.holding.includes(first)) this.take(first, seat);
        else if (this.take(second, seat)) {
          p.state = "eating";
          p.timer = 3 + Math.floor(this.random() * 3);
        }
      } else if (--p.timer <= 0) {
        this.meals++;
        for (const fork of p.holding) this.forks[fork] = null;
        p.holding = [];
        p.state = "thinking";
        p.timer = 1 + Math.floor(this.random() * 2);
      }
    });
  }
  // everyone holds exactly one fork and waits for a neighbour's: the wait-for graph is a cycle
  isDeadlocked() {
    return this.philosophers.every((p) => p.state === "hungry" && p.holding.length === 1);
  }
}
