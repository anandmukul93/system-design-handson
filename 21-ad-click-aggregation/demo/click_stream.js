// A source of click events: mostly in order, some delayed (late), some sent twice (duplicates).
export const ADS = ["ad-A", "ad-B", "ad-C", "ad-D", "ad-E"];

export class ClickStream {
  constructor(random) {
    this.random = random;
    this.nextId = 0;
  }
  // events produced during processing-time second `now`: [{ id, ad, eventTime }]
  emit(now, count, delayedPercent, duplicatePercent) {
    const out = [];
    for (let i = 0; i < count; i++) {
      const delayed = this.random() * 100 < delayedPercent;
      const event = {
        id: this.nextId++,
        ad: ADS[Math.floor(Math.pow(this.random(), 1.8) * ADS.length)], // some ads are much more popular
        eventTime: now - (delayed ? Math.floor(this.random() * 25) : 0),
      };
      out.push(event);
      if (this.random() * 100 < duplicatePercent) out.push({ ...event });
    }
    return out;
  }
}
