// Shared hash function (FNV-1a, 32-bit). Both routers use it so the comparison is fair.
export function hash32(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
// position on the ring in [0, 1)
export const ringPosition = (str) => hash32(str) / 4294967296;
