function classifyStructure(swings) {
  if (!Array.isArray(swings) || swings.length < 2) {
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

function getStructureState(structure, candleIndex) {
  const state = {
    trend: null,
    protectedLow: null,
    protectedHigh: null,
  };

  let latestHigh = null;
  let latestLow = null;

  for (const event of structure) {
    const confirmationIndex = event.confirmationIndex ?? event.index + 1;
    if (confirmationIndex > candleIndex) {
      break;
    }

    if (event.structure === "HH" || event.structure === "LH") {
      latestHigh = event;
    }

    if (event.structure === "HL" || event.structure === "LL") {
      latestLow = event;
    }

    if (latestHigh?.structure === "HH" && latestLow?.structure === "HL") {
      state.trend = "BULLISH";
      state.protectedLow = latestLow;
      state.protectedHigh = null;
    }

    if (latestHigh?.structure === "LH" && latestLow?.structure === "LL") {
      state.trend = "BEARISH";
      state.protectedHigh = latestHigh;
      state.protectedLow = null;
    }
  }

  return state;
}

module.exports = {
  classifyStructure,
  getStructureState,
};
