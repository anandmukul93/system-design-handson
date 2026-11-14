// The origin server: the source of truth. Every page has a version that goes up when it is republished.
export class Origin {
  constructor(pageCount = 30) {
    // the first third are product pages, the rest blog posts; tags let a CDN purge a whole group at once
    this.pages = Array.from({ length: pageCount }, (_, i) => ({
      path: "/p/" + i,
      tag: i < pageCount / 3 ? "products" : "blog",
      version: 1,
    }));
    this.fetches = 0;
  }
  fetch(page) {
    this.fetches++;
    return { version: page.version, tag: page.tag };
  }
  publish(tag) {
    for (const page of this.pages) if (page.tag === tag) page.version++;
  }
}
