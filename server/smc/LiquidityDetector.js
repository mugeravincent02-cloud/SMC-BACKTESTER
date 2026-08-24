const { detectEqualLevels } = require("../../shared/helpers/DetectEqualLevels");
const {
  detectPreviousDayLiquidity,
} = require("../smc/PreviousDayLiquidityDetector");

function detectLiquidity(swings, candles) {
  const equalHighs = detectEqualLevels(swings, "HIGH", "high");
  const equalLows = detectEqualLevels(swings, "LOW", "low");
  const previousDayLiquidity = detectPreviousDayLiquidity(candles);

  return {
    equalHighs,
    equalLows,
    previousDayLiquidity,
  };
}

module.exports = {
  detectLiquidity,
};
