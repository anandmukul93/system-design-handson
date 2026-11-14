// A deterministic fake web to crawl: every URL always has the same links and content. Includes a spider trap.
export const HOSTS = ["news.test", "shop.test", "blog.test", "wiki.test", "trap.test"];
export const SEEDS = ["news.test/", "shop.test/", "trap.test/"];

// tiny seeded random generator, so a URL's links never change between runs
function seeded(text) {
  let a = 0;
  for (const ch of text) a = (Math.imul(a, 31) + ch.charCodeAt(0)) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const hostOf = (url) => url.split("/")[0];

export function linksOf(url) {
  const host = hostOf(url);
  const path = url.slice(url.indexOf("/"));
  if (host === "trap.test") return [`trap.test${path}x/`]; // endless, like an infinite calendar
  const rnd = seeded(url);
  const count = 2 + Math.floor(rnd() * 3);
  return Array.from(
    { length: count },
    () => `${HOSTS[Math.floor(rnd() * HOSTS.length)]}/p${Math.floor(rnd() * 12)}`,
  );
}

// some pages are mirrors: different URL, identical content
export function contentOf(url) {
  return url.endsWith("p3") || url.endsWith("p7") ? "mirror-of-home" : url;
}
