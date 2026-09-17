function classifyStructure(swings) {
  if (swings.length < 2) {
    return [];
  }

  const structure = [];

  const previousByType = {};

  for (const current of swings) {
    const previous = previousByType[current.type];

    if (previous && current.type === "HIGH") {
      structure.push({
        ...current,
        structure: current.candle.high > previous.candle.high ? "HH" : "LH",
      });
    }

    if (previous && current.type === "LOW") {
      structure.push({
        ...current,
        structure: current.candle.low > previous.candle.low ? "HL" : "LL",
      });
    }
    previousByType[current.type] = current;
  }
  return structure;
}

module.exports = {
  classifyStructure,
};
