function buildChartOverlays(zones) {
  if (!Array.isArray(zones)) {
    return [];
  }

  return zones.filter(Boolean).map((zone) => {
    const direction = zone.direction || "NEUTRAL";
    const hasRange = Number.isFinite(zone.low) && Number.isFinite(zone.high);

    if (zone.type === "FVG" || hasRange) {
      return {
        id: zone.id ?? zone.index ?? `${direction}-${zone.type ?? "zone"}`,
        direction,
        type: "box",
        start: zone.low ?? zone.startPrice ?? zone.level ?? 0,
        end: zone.high ?? zone.endPrice ?? zone.level ?? 0,
        low: zone.low,
        high: zone.high,
        index: zone.index,
        level: zone.level,
      };
    }

    return {
      id: zone.id ?? zone.index ?? `${direction}-${zone.type ?? "zone"}`,
      direction,
      type: "line",
      price: zone.level ?? zone.low ?? zone.high ?? 0,
      low: zone.low,
      high: zone.high,
      index: zone.index,
      level: zone.level,
    };
  });
}

module.exports = {
  buildChartOverlays,
};
