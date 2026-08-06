export function mapCandlesToChart(candles) {
  return candles.map((candle) => ({
    time: candle.time / 1000,
    open: candle.open,
    high: candle.high,
    low: candle.low,
    close: candle.close,
  }));
}
