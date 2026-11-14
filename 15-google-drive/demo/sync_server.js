// The sync server: one current version per file. A device may only save on top of the version it last saw.
import { splitBlocks } from "./blocks.js";

export class SyncServer {
  constructor(blockStore, initialText) {
    this.blocks = blockStore;
    this.version = 1;
    this.text = initialText;
    splitBlocks(initialText).forEach((b) => this.blocks.upload(b));
  }

  // device: { name, baseVersion, text }
  // returns { status: "unchanged" | "conflict" | "saved", uploadedBytes, fileBytes, blockCount }
  sync(device) {
    if (device.text === this.text) return { status: "unchanged" };
    if (device.baseVersion !== this.version) {
      // someone else saved first: keep theirs as the file, and the caller keeps this edit as a conflict copy
      return { status: "conflict", serverVersion: this.version };
    }
    const blocks = splitBlocks(device.text);
    const uploadedBytes = blocks.reduce((sum, b) => sum + this.blocks.upload(b), 0);
    this.version++;
    this.text = device.text;
    device.baseVersion = this.version;
    return { status: "saved", uploadedBytes, fileBytes: device.text.length, blockCount: blocks.length };
  }

  pull(device) {
    device.text = this.text;
    device.baseVersion = this.version;
  }
}
