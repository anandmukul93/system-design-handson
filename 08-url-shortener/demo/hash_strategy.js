// Variant 2, hash + collision check: hash the URL, keep 7 characters, and rehash with a salt on collision.
export class HashStrategy {
  constructor(hashFn) {
    this.hash = hashFn;
  }
  // contract: makeCode(longUrl, isTaken) -> { code, explanation }
  // isTaken(code) is true when the code already maps to a DIFFERENT url
  makeCode(longUrl, isTaken) {
    let salt = 0;
    let code;
    do {
      code = this.hash(longUrl + (salt ? "#" + salt : ""))
        .toString(36)
        .slice(0, 7);
      salt++;
    } while (isTaken(code));
    const collisions = salt - 1;
    return {
      code,
      explanation:
        `hash("${longUrl.slice(0, 30)}…") → first 7 chars = ${code}\n` +
        (collisions ? `collided ${collisions}x, appended a salt and rehashed` : "no collision in the DB"),
    };
  }
}
