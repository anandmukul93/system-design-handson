// The data store: objects are appended into fixed-size data files. Deleting only marks; compaction reclaims.
// Every object carries a checksum of its data so corruption is detected on read.
export const FILE_SIZE = 64; // units per data file

export class ObjectStore {
  constructor(checksumFn) {
    this.checksum = checksumFn;
    this.files = [[]]; // each file is a list of { id, size, data, checksum, deleted }
    this.index = new Map(); // object id -> object (the metadata store)
    this.nextNumber = 1;
  }
  used(file) {
    return file.reduce((a, o) => a + o.size, 0);
  }
  append(object) {
    let file = this.files[this.files.length - 1];
    if (this.used(file) + object.size > FILE_SIZE) {
      file = [];
      this.files.push(file); // the old file becomes read-only
    }
    file.push(object);
    this.index.set(object.id, object);
  }
  put(size, data) {
    const id = "obj" + this.nextNumber++;
    const object = { id, size, data: data ?? id + ":" + Math.random(), deleted: false };
    object.checksum = this.checksum(object.data);
    this.append(object);
    return object;
  }
  remove(id) {
    const object = this.index.get(id);
    if (!object) return false;
    object.deleted = true; // the bytes stay on disk until compaction
    this.index.delete(id);
    return true;
  }
  // copy live objects into fresh files and drop the old ones. Returns { before, after, copied } file counts.
  compact() {
    const before = this.files.length;
    const live = this.files.flat().filter((o) => !o.deleted);
    this.files = [[]];
    this.index = new Map();
    live.forEach((o) => this.append(o));
    return { before, after: this.files.length, copied: live.length };
  }
  isCorrupt(object) {
    return this.checksum(object.data) !== object.checksum;
  }
  // read every object and verify its checksum; corrupt ones are repaired "from another replica"
  verifyAll() {
    const corrupt = [...this.index.values()].filter((o) => this.isCorrupt(o));
    for (const o of corrupt) {
      o.data = o.data.slice(0, -1); // pretend a healthy copy was fetched from another node
      o.checksum = this.checksum(o.data);
    }
    return corrupt.map((o) => o.id);
  }
  usage() {
    const all = this.files.flat();
    const live = all.filter((o) => !o.deleted).reduce((a, o) => a + o.size, 0);
    const allocated = all.reduce((a, o) => a + o.size, 0);
    return { live, allocated, garbage: allocated - live };
  }
}
