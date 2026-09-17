function detectBOS(candles, swings) {
  const bosEvents = [];

  for (const swing of swings) {
    if (swing.type === "HIGH") {
      for (let i = swing.index + 1; i < candles.length; i++) {
        if (candles[i].close > swing.candle.high) {
          bosEvents.push({
            direction: "BULLISH",
            brokenSwing: swing.index,
            // Keep the previous bullish field for existing API consumers.
            brokenSwings: swing.index,
            breakIndex: i,
            breakPrice: candles[i].close,
          });
          break;
        }
      }
    }

    if (swing.type === "LOW") {
      for (let i = swing.index + 1; i < candles.length; i++) {
        if (candles[i].close < swing.candle.low) {
          bosEvents.push({
            direction: "BEARISH",
            brokenSwing: swing.index,
            breakIndex: i,
            breakPrice: candles[i].close,
          });
          break;
        }
      }
    }
  }

  return bosEvents.sort((first, second) => first.breakIndex - second.breakIndex);
}
module.exports = {
  detectBOS,
};
