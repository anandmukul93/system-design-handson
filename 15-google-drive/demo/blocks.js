// Splitting a file into fixed-size blocks and addressing each block by the hash of its content.
export const BLOCK_SIZE = 8; // characters per block here; about 4 MB in a real sync client

export function splitBlocks(text) {
  const blocks = [];
  for (let i = 0; i < text.length; i += BLOCK_SIZE) blocks.push(text.slice(i, i + BLOCK_SIZE));
  return blocks;
}

// content-addressed storage: identical blocks are stored once, whoever uploads them
export class BlockStore {
  constructor(hashFn) {
    this.hash = hashFn;
    this.hashes = new Set();
  }
  has(block) {
    return this.hashes.has(this.hash(block));
  }
  // returns the number of bytes actually uploaded (0 when the block was already stored)
  upload(block) {
    if (this.has(block)) return 0;
    this.hashes.add(this.hash(block));
    return block.length;
  }
}
