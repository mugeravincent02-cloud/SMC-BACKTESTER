function detectCHOCH(structure) {
  const chochEvents = [];

  for (let i = 1; i < structure.length; i++) {
    const previous = structure[i - 1];
    const current = structure[i];

    //Bullish trend becomes bearish
    if (previous.structure === "HL" && current.structure == "LL") {
      chochEvents.push({
        direction: "BEARISH",
        index: current.index,
        candle: current.current,
      });
    }

    //Bearish trend becomes bullish
    if (previous.structure === "LH" && current.structure === "HH") {
      chochEvents.push({
        direction: "BULLISH",
        index: current.index,
        candle: current.candle,
      });
    }
  }
  return chochEvents;
}
module.exports = {
  detectCHOCH,
};
