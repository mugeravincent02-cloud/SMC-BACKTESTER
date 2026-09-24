const { getStructureState } = require("./StructureDetector");

function detectCHOCH(candles, structure) {
  if (!Array.isArray(candles) || !Array.isArray(structure)) {
    return [];
  }

  const chochEvents = [];
  const brokenLevels = new Set();

  for (let i = 0; i < candles.length; i++) {
    const state = getStructureState(structure, i);

    if (state.trend === "BULLISH" && state.protectedLow) {
      const levelKey = `BEARISH:${state.protectedLow.index}`;
      if (candles[i].close < state.protectedLow.candle.low && !brokenLevels.has(levelKey)) {
        brokenLevels.add(levelKey);
        chochEvents.push({
          direction: "BEARISH",
          brokenStructure: state.protectedLow.index,
          breakIndex: i,
          breakPrice: candles[i].close,
          candle: candles[i],
        });
      }
    }

    if (state.trend === "BEARISH" && state.protectedHigh) {
      const levelKey = `BULLISH:${state.protectedHigh.index}`;
      if (candles[i].close > state.protectedHigh.candle.high && !brokenLevels.has(levelKey)) {
        brokenLevels.add(levelKey);
      chochEvents.push({
          direction: "BULLISH",
          brokenStructure: state.protectedHigh.index,
          breakIndex: i,
          breakPrice: candles[i].close,
          candle: candles[i],
      });
      }
    }
  }
  return chochEvents;
}
module.exports = {
  detectCHOCH,
};
