const { equalLevelTolerance } = require("../../server/config/smcConfig");

function detectEqualLevels(
  swings,
  type,
  priceKey,
  tolerance = equalLevelTolerance,
) {
  if (!Array.isArray(swings)) {
    return [];
  }

  const numericTolerance = Number(tolerance);
  if (!Number.isFinite(numericTolerance) || numericTolerance < 0) {
    return [];
  }

  const equalLevels = [];
  const filteredSwings = swings.filter((swing) => swing.type === type);

  for (let i = 0; i < filteredSwings.length - 1; i++) {
    const first = filteredSwings[i];
    const second = filteredSwings[i + 1];

    const firstPrice = Number(first?.candle?.[priceKey]);
    const secondPrice = Number(second?.candle?.[priceKey]);

    if (!Number.isFinite(firstPrice) || !Number.isFinite(secondPrice)) {
      continue;
    }

    const difference = Math.abs(firstPrice - secondPrice);
    if (difference <= firstPrice * numericTolerance) {
      equalLevels.push({ first, second });
    }
  }

  return equalLevels;
}

module.exports = {
  detectEqualLevels,
};
