function detectBOS(candles, swings) {
  const bosEvents = [];

  for (const swing of swings) {
    if (swing.type === "HIGH") {
      for (let i = swing.index + 1; i < candles.length; i++) {
        if (candles[i].close > swing.candle.high) {
          bosEvents.push({
            direction: "BULLISH",
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

  return bosEvents;
}
module.exports = {
  detectBOS,
};
