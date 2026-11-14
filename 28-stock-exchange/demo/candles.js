// Candlesticks: fold a stream of trade prices into open / high / low / close per time bucket.
export class CandleBuilder {
  constructor() {
    this.closed = [];
    this.current = null;
  }
  addTrade(price) {
    if (!this.current) this.current = { open: price, high: price, low: price, close: price };
    this.current.high = Math.max(this.current.high, price);
    this.current.low = Math.min(this.current.low, price);
    this.current.close = price;
  }
  // end the current bucket; the next candle opens at this one's close
  roll() {
    if (!this.current) return;
    this.closed.push(this.current);
    const last = this.current.close;
    this.current = { open: last, high: last, low: last, close: last };
  }
  recent(count) {
    return [...this.closed, this.current].filter(Boolean).slice(-count);
  }
}
