function detectOrderBlocks(candles) {
  if (!Array.isArray(candles) || candles.length < 3) {
    return [];
  }

  const blocks = [];
  let lastDirection = null;
  let activeBlock = null;

  for (let i = 1; i < candles.length; i++) {
    const previous = candles[i - 1];
    const current = candles[i];

    if (!previous || !current) {
      continue;
    }

    const bullishBreak =
      current.close > previous.high &&
      current.close > current.open &&
      current.high > previous.high;

    const bearishBreak =
      current.close < previous.low &&
      current.close < current.open &&
      current.low < previous.low;

    if (
      activeBlock &&
      current.low <= activeBlock.zoneHigh &&
      current.high >= activeBlock.zoneLow
    ) {
      continue;
    }

    if (bullishBreak) {
      if (lastDirection !== "BULLISH") {
        const block = {
          direction: "BULLISH",
          index: i,
          candleIndex: i,
          candle: current,
          zoneHigh: current.high,
          zoneLow: current.low,
          createdAt: current.time,
          impulseHigh: previous.high,
          impulseLow: previous.low,
          previousClose: previous.close,
          currentClose: current.close,
        };

        blocks.push(block);
        activeBlock = block;
        lastDirection = "BULLISH";
      }
      continue;
    }

    if (bearishBreak) {
      if (lastDirection !== "BEARISH") {
        const block = {
          direction: "BEARISH",
          index: i,
          candleIndex: i,
          candle: current,
          zoneHigh: current.high,
          zoneLow: current.low,
          createdAt: current.time,
          impulseHigh: previous.high,
          impulseLow: previous.low,
          previousClose: previous.close,
          currentClose: current.close,
        };

        blocks.push(block);
        activeBlock = block;
        lastDirection = "BEARISH";
      }
      continue;
    }

    if (lastDirection === "BULLISH" && current.close < previous.close) {
      lastDirection = null;
      activeBlock = null;
    }

    if (lastDirection === "BEARISH" && current.close > previous.close) {
      lastDirection = null;
      activeBlock = null;
    }
  }

  return blocks;
}

module.exports = {
  detectOrderBlocks,
};
