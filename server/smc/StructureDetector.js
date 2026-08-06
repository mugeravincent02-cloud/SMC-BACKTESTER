function classifyStructure(swings) {
  if (swings.length < 2) {
    return [];
  }

  const structure = [];

  for (let i = 1; i < swings.length; i++) {
    const previous = swings[i - 1];
    const current = swings[i];

    if (previous.type === "HIGH" && current.type === "HIGH") {
      structure.push({
        ...current,
        structure: current.candle.high > previous.candle.high ? "HH" : "LH",
      });
    }

    if (previous.type === "LOW" && current.type === "LOW") {
      structure.push({
        ...current,
        structure: current.candle.low > previous.candle.low ? "HL" : "LL",
      });
    }
  }
  return structure;
}

module.exports = {
  classifyStructure,
};
