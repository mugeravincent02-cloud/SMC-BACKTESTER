const { classifyStructure, getStructureState } = require("./StructureDetector");

function latestConfirmedSwing(swings, type, candleIndex) {
  let latest = null;

  for (const swing of swings) {
    const confirmationIndex = swing.confirmationIndex ?? swing.index + 1;
    if (swing.type === type && confirmationIndex <= candleIndex) {
      latest = swing;
    }
  }

  return latest;
}

function detectBOS(candles, swings, structure = classifyStructure(swings)) {
  if (!Array.isArray(candles) || !Array.isArray(swings)) {
    return [];
  }

  const bosEvents = [];
  const brokenLevels = new Set();

  for (let i = 0; i < candles.length; i++) {
    const state = getStructureState(structure, i);
    const type = state.trend === "BULLISH" ? "HIGH" : state.trend === "BEARISH" ? "LOW" : null;
    const swing = type && latestConfirmedSwing(swings, type, i);

    if (!swing) {
      continue;
    }

    const levelKey = `${state.trend}:${swing.index}`;
    const level = type === "HIGH" ? swing.candle.high : swing.candle.low;
    const isBroken = type === "HIGH" ? candles[i].close > level : candles[i].close < level;

    if (isBroken && !brokenLevels.has(levelKey)) {
      brokenLevels.add(levelKey);
      const event = {
        direction: state.trend,
        brokenSwing: swing.index,
        brokenSwingCandle: swing.candle,
        breakIndex: i,
        breakPrice: candles[i].close,
      };

      if (state.trend === "BULLISH") {
        event.brokenSwings = swing.index;
      }

      bosEvents.push(event);
    }
  }

  return bosEvents;
}

module.exports = {
  detectBOS,
};
