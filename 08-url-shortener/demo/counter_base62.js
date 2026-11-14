// Variant 1, global counter + base62: every URL gets the next integer id, encoded in 62 symbols. No collisions.
const ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

// returns { code, steps } where steps explains each division
export function base62(n) {
  if (n === 0) return { code: "0", steps: ["0 → '0'"] };
  const steps = [];
  let code = "";
  while (n > 0) {
    const remainder = n % 62;
    steps.push(`${n} % 62 = ${remainder} → '${ALPHABET[remainder]}'`);
    code = ALPHABET[remainder] + code;
    n = Math.floor(n / 62);
  }
  return { code, steps };
}

export class CounterStrategy {
  constructor(start = 100000000000) {
    this.next = start; // start high so codes are 7 characters, like a real service
  }
  // contract: makeCode(longUrl, isTaken) -> { code, explanation }
  makeCode() {
    const id = this.next++;
    const { code, steps } = base62(id);
    return { code, explanation: [`id = ${id}`, ...steps, `read remainders bottom-up → ${code}`].join("\n") };
  }
}
