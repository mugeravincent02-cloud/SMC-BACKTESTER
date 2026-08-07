const { detectEqualLevels } = require("../../shared/helpers/DetectEqualLevels");

function detectLiquidity(swings) {
  const equalHighs = detectEqualLevels(swings, "HIGH", "high");
  const equalLows = detectEqualLevels(swings, "LOW", "low");

  return {
    equalHighs,
    equalLows,
  };
}

module.exports = {
  detectLiquidity,
};
