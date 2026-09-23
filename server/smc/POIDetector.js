function detectPOIs(zones) {
  if (!Array.isArray(zones)) {
    return [];
  }

  const validDirections = new Set(["BULLISH", "BEARISH"]);

  return zones
    .filter((zone) => {
      if (!zone || !validDirections.has(zone.direction)) {
        return false;
      }

      const type = zone.type;
      if (type === "FVG") {
        return (
          Number.isFinite(zone.low) &&
          Number.isFinite(zone.high) &&
          zone.high > zone.low
        );
      }

      if (type === "LIQUIDITY") {
        return Number.isFinite(zone.level);
      }

      if (type === "STRUCTURE") {
        return (
          Number.isFinite(zone.level) ||
          (Number.isFinite(zone.low) && Number.isFinite(zone.high))
        );
      }

      return false;
    })
    .map((zone) => ({
      direction: zone.direction,
      type: zone.type,
      index: zone.index,
      low: zone.low,
      high: zone.high,
      level: zone.level,
    }));
}

module.exports = {
  detectPOIs,
};
