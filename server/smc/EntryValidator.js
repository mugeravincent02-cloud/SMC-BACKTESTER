function validateEntry({
  direction,
  entry,
  stop,
  takeProfit,
  support,
  poi,
  htfLtf,
}) {
  const hasValidPOI = Boolean(
    poi &&
    poi.direction === direction &&
    (typeof poi.level === "number" ? entry >= poi.level : true),
  );

  const hasConfluence = Boolean(
    htfLtf && htfLtf.aligned === true && htfLtf.direction === direction,
  );

  const hasRiskStructure = Boolean(
    typeof entry === "number" &&
    typeof stop === "number" &&
    typeof takeProfit === "number" &&
    typeof support === "number" &&
    entry > stop &&
    takeProfit > entry &&
    support <= entry,
  );

  const valid = hasValidPOI && hasConfluence && hasRiskStructure;

  return {
    valid,
    direction,
    checks: {
      hasValidPOI,
      hasConfluence,
      hasRiskStructure,
    },
    entry,
    stop,
    takeProfit,
    support,
    poi,
    htfLtf,
  };
}

module.exports = {
  validateEntry,
};
