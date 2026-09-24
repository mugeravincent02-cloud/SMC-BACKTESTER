function detectSwings(candles) {
  if (!Array.isArray(candles) || candles.length < 3) {
    return [];
  }

  const swings = [];

  for (let i = 1; i < candles.length - 1; i++) {
    const previous = candles[i - 1];
    const current = candles[i];
    const next = candles[i + 1];

    const swingHigh = current.high > previous.high && current.high > next.high;
    const swingLow = current.low < previous.low && current.low < next.low;

    if (swingHigh) {
      swings.push({
        type: "HIGH",
        index: i,
        confirmationIndex: i + 1,
        candle: current,
      });
    }

    if (swingLow) {
      swings.push({
        type: "LOW",
        index: i,
        confirmationIndex: i + 1,
        candle: current,
      });
    }
  }
  return swings;
}

module.exports = {
  detectSwings,
};
