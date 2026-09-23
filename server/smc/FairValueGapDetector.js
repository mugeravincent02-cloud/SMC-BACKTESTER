function detectFairValueGaps(candles) {
  if (!Array.isArray(candles) || candles.length < 2) {
    return [];
  }

  const gaps = [];

  for (let i = 1; i < candles.length; i++) {
    const previous = candles[i - 1];
    const current = candles[i];

    if (current.low > previous.high && current.close > previous.close) {
      gaps.push({
        direction: "BULLISH",
        startIndex: i - 1,
        endIndex: i,
        startPrice: previous.high,
        endPrice: current.low,
      });
    }

    if (current.high < previous.low && current.close < previous.close) {
      gaps.push({
        direction: "BEARISH",
        startIndex: i - 1,
        endIndex: i,
        startPrice: previous.low,
        endPrice: current.high,
      });
    }
  }

  return gaps;
}

module.exports = {
  detectFairValueGaps,
};
