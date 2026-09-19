const { it } = require("node:test");
const assert = require("node:assert/strict");
const { classifyStructure } = require("../../server/smc/StructureDetector");
const { detectCHOCH } = require("../../server/smc/CHOCHDetector");
const { detectBOS } = require("../../server/smc/BOSDetector");
const { detectSwings } = require("../../server/smc/SwingDetector");
const { detectLiquidity } = require("../../server/smc/LiquidityDetector");

function candle(high, low, close) {
  return { high, low, close };
}

function bullishCandles(breakClose = 15) {
  return [
    candle(10, 5, 8), candle(12, 7, 10), candle(11, 6, 8),
    candle(10, 4, 6), candle(11, 5, 8), candle(14, 7, 12),
    candle(13, 6, 9), candle(12, 5, 8), candle(13, 6, 10),
    candle(15, 7, breakClose),
  ];
}

function bearishCandles(breakClose = 5) {
  return [
    candle(15, 10, 12), candle(14, 8, 10), candle(15, 9, 12),
    candle(20, 11, 18), candle(17, 10, 13), candle(16, 6, 8),
    candle(17, 7, 12), candle(18, 9, 16), candle(17, 8, 12),
    candle(16, 5, breakClose),
  ];
}

it("detects confirmed deterministic swings with their source candles", () => {
  const candles = bullishCandles();
  assert.deepEqual(detectSwings(candles).map(({ type, index, confirmationIndex, candle: source }) => [
    type, index, confirmationIndex, source,
  ]), [
    ["HIGH", 1, 2, candles[1]], ["LOW", 3, 4, candles[3]],
    ["HIGH", 5, 6, candles[5]], ["LOW", 7, 8, candles[7]],
  ]);
});

it("classifies bullish and bearish structure using the preceding same-type swing", () => {
  const bullish = classifyStructure(detectSwings(bullishCandles()));
  const bearish = classifyStructure(detectSwings(bearishCandles()));

  assert.deepEqual(bullish.map(({ index, structure }) => [index, structure]), [[5, "HH"], [7, "HL"]]);
  assert.deepEqual(bearish.map(({ index, structure }) => [index, structure]), [[5, "LL"], [7, "LH"]]);
});

it("emits only a bullish BOS after bullish structure is confirmed", () => {
  const candles = bullishCandles();
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);
  const bos = detectBOS(candles, swings, structure);

  assert.deepEqual(bos.map(({ direction, brokenSwing, breakIndex, breakPrice }) => (
    { direction, brokenSwing, breakIndex, breakPrice }
  )), [{ direction: "BULLISH", brokenSwing: 5, breakIndex: 9, breakPrice: 15 }]);
  assert.equal(bos[0].brokenSwingCandle, candles[5]);
  assert.equal(bos[0].brokenSwings, 5, "legacy bullish field remains available");
});

it("returns BOS events in candle order when later confirmed highs break", () => {
  const candles = [...bullishCandles(), candle(14, 8, 10), candle(13, 7, 9), candle(16, 9, 16)];
  const swings = detectSwings(candles);
  const bos = detectBOS(candles, swings, classifyStructure(swings));
  assert.deepEqual(bos.map(({ brokenSwing, breakIndex }) => [brokenSwing, breakIndex]), [[5, 9], [9, 12]]);
});

it("emits only a bearish BOS after bearish structure is confirmed", () => {
  const candles = bearishCandles();
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);
  const bos = detectBOS(candles, swings, structure);

  assert.deepEqual(bos.map(({ direction, brokenSwing, breakIndex, breakPrice }) => (
    { direction, brokenSwing, breakIndex, breakPrice }
  )), [{ direction: "BEARISH", brokenSwing: 5, breakIndex: 9, breakPrice: 5 }]);
  assert.equal(bos[0].brokenSwingCandle, candles[5]);
});

it("treats a protected opposing-swing break as CHoCH, not BOS", () => {
  const candles = bullishCandles(4);
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);

  assert.deepEqual(detectBOS(candles, swings, structure), []);
  assert.deepEqual(detectCHOCH(candles, structure).map(({ direction, brokenStructure, breakIndex, breakPrice, candle: source }) => (
    { direction, brokenStructure, breakIndex, breakPrice, source }
  )), [{
    direction: "BEARISH", brokenStructure: 7, breakIndex: 9, breakPrice: 4, source: candles[9],
  }]);
});

it("does not use a swing before its confirmation candle", () => {
  const candles = bullishCandles();
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);
  const earlyCandles = candles.slice(0, 8);
  assert.deepEqual(detectBOS(earlyCandles, swings, structure), []);
  assert.deepEqual(detectCHOCH(earlyCandles, structure), []);
});

it("returns no events for empty or insufficient candle input", () => {
  assert.deepEqual(detectSwings([]), []);
  assert.deepEqual(detectSwings([{ high: 10, low: 5 }]), []);
  assert.deepEqual(detectSwings([{ high: 10, low: 5 }, { high: 11, low: 4 }]), []);
  assert.deepEqual(detectBOS([], []), []);
  assert.deepEqual(detectCHOCH([], []), []);
});

it("keeps equal and ambiguous candles out of swing and structure claims", () => {
  const candles = [candle(10, 5, 7), candle(10, 4, 6), candle(9, 4, 6)];
  assert.deepEqual(detectSwings(candles), []);
  assert.deepEqual(classifyStructure([]), []);
});

it("preserves equal-level liquidity behavior", () => {
  const swings = [
    { type: "HIGH", index: 1, candle: { high: 100 } },
    { type: "LOW", index: 2, candle: { low: 50 } },
    { type: "HIGH", index: 3, candle: { high: 100.01 } },
    { type: "LOW", index: 4, candle: { low: 50.01 } },
  ];
  const candles = [
    { time: Date.UTC(2026, 0, 1), high: 100, low: 50 },
    { time: Date.UTC(2026, 0, 1, 12), high: 110, low: 40 },
    { time: Date.UTC(2026, 0, 2), high: 120, low: 60 },
  ];
  const liquidity = detectLiquidity(swings, candles);
  assert.deepEqual(liquidity.equalHighs, [{ first: swings[0], second: swings[2] }]);
  assert.deepEqual(liquidity.equalLows, [{ first: swings[1], second: swings[3] }]);
});
