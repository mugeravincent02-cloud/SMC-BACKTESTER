const { detectEqualLevels } = require("../../shared/helpers/DetectEqualLevels");
const { equalLevelTolerance } = require("../config/smcConfig");
const {
  detectPreviousDayLiquidity,
  detectPreviousWeekLiquidity,
  detectSessionLiquidity,
} = require("../smc/PreviousDayLiquidityDetector");

function detectSwingLiquidity(swings) {
  if (!Array.isArray(swings)) {
    return { highs: [], lows: [] };
  }

  return {
    highs: swings
      .filter((swing) => swing.type === "HIGH")
      .map((swing) => ({
        ...swing,
        price: swing.candle?.high,
      })),
    lows: swings
      .filter((swing) => swing.type === "LOW")
      .map((swing) => ({
        ...swing,
        price: swing.candle?.low,
      })),
  };
}

function latestConfirmedSwing(swings, type, candleIndex) {
  let latest = null;
  let latestConfirmation = -Infinity;

  for (const swing of swings) {
    if (swing.type !== type) {
      continue;
    }

    const confirmationIndex = swing.confirmationIndex ?? swing.index + 1;
    if (
      confirmationIndex <= candleIndex &&
      confirmationIndex > latestConfirmation
    ) {
      latest = swing;
      latestConfirmation = confirmationIndex;
    }
  }

  return latest;
}

function detectSweeps(swings, candles) {
  if (!Array.isArray(swings) || !Array.isArray(candles)) {
    return [];
  }

  const events = [];
  const seen = new Set();

  for (const swing of swings) {
    const levelKey = `${swing.type}:${swing.index}`;
    if (seen.has(levelKey)) {
      continue;
    }

    const direction = swing.type === "LOW" ? "BULLISH" : "BEARISH";
    const type = direction === "BULLISH" ? "SSL" : "BSL";
    const level = swing.type === "LOW" ? swing.candle.low : swing.candle.high;
    const confirmationStart = swing.confirmationIndex ?? swing.index + 1;

    let sweepCandleIndex = null;
    for (let i = confirmationStart; i < candles.length; i++) {
      const candle = candles[i];
      const isSweep =
        direction === "BULLISH" ? candle.low < level : candle.high > level;

      if (isSweep) {
        sweepCandleIndex = i;
        break;
      }
    }

    if (sweepCandleIndex === null) {
      continue;
    }

    const sweepCandle = candles[sweepCandleIndex];
    let confirmationIndex = null;
    for (let j = sweepCandleIndex + 1; j < candles.length; j++) {
      const confirmationCandle = candles[j];
      const isConfirmed =
        direction === "BULLISH"
          ? confirmationCandle.close > level
          : confirmationCandle.close < level;

      if (isConfirmed) {
        confirmationIndex = j;
        break;
      }
    }

    seen.add(levelKey);
    events.push({
      direction,
      type,
      level,
      sweepCandleIndex,
      sweepCandleTime: sweepCandle.time,
      relevantPrice: level,
      reclaimed: confirmationIndex !== null,
      confirmationIndex,
      confirmationTime:
        confirmationIndex === null ? null : candles[confirmationIndex].time,
    });
  }

  return events;
}

function detectLiquidity(swings, candles, options = {}) {
  const config = {
    ...require("../config/smcConfig"),
    ...(options.config || {}),
    sessionConfig: {
      ...require("../config/smcConfig").sessionConfig,
      ...(options.sessionConfig || {}),
    },
  };

  const equalHighs = detectEqualLevels(
    swings,
    "HIGH",
    "high",
    config.equalLevelTolerance,
  );
  const equalLows = detectEqualLevels(
    swings,
    "LOW",
    "low",
    config.equalLevelTolerance,
  );
  const previousDayLiquidity = detectPreviousDayLiquidity(candles, config);
  const previousWeekLiquidity = detectPreviousWeekLiquidity(candles, config);
  const sessionLiquidity = detectSessionLiquidity(candles, config);
  const sweeps = detectSweeps(swings, candles);

  return {
    equalHighs,
    equalLows,
    swingLiquidity: detectSwingLiquidity(swings),
    previousDayLiquidity,
    previousWeekLiquidity,
    sessionLiquidity,
    sweeps,
    config,
  };
}

module.exports = {
  detectLiquidity,
  detectSwingLiquidity,
  detectSweeps,
};
