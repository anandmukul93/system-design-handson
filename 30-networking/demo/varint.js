// Protobuf varint encoding: 7 bits of the number per byte, low bits first; the top bit means "more follows".
export function encodeVarint(value) {
  let n = BigInt(value);
  const bytes = [];
  do {
    let byte = Number(n & 0x7fn);
    n >>= 7n;
    if (n > 0n) byte |= 0x80;
    bytes.push(byte);
  } while (n > 0n);
  return bytes;
}

export function decodeVarint(bytes) {
  let n = 0n;
  bytes.forEach((byte, i) => (n |= BigInt(byte & 0x7f) << BigInt(7 * i)));
  return n;
}
