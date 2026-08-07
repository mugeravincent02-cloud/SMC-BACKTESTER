// const { equalLevelTolerance } = require("../../config/smcConfig");
const { equalLevelTolerance } = require("../../server/config/smcConfig");

function detectEqualLevels(swings, type, priceKey) {
  const equalLevels = [];

  const filteredSwings = swings.filter((swing) => swing.type === type);

  for (let i = 0; i < filteredSwings.length - 1; i++) {
    const first = filteredSwings[i];

    const second = filteredSwings[i + 1];

    const difference = Math.abs(
      first.candle[priceKey] - second.candle[priceKey]
    );
    if (difference <= first.candle[priceKey] * equalLevelTolerance) {
      equalLevelTolerance.push({ first, second });
    }
  }
  return equalLevels;
}

module.exports = {
  detectEqualLevels,
};
