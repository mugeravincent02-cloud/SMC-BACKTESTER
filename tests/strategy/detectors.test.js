const { it } = require("node:test");
const assert = require("node:assert/strict");
const { classifyStructure } = require("../../server/smc/StructureDetector");
const { detectCHOCH } = require("../../server/smc/CHOCHDetector");
const { detectBOS } = require("../../server/smc/BOSDetector");
const { detectSwings } = require("../../server/smc/SwingDetector");
const { detectLiquidity } = require("../../server/smc/LiquidityDetector");

function swing(type, index, price) {
  return { type, index, candle: { [type === "HIGH" ? "high" : "low"]: price } };
}

it("classifies alternating swings using the preceding swing of the same type", () => {
  const swings = [
    swing("HIGH", 1, 10), swing("LOW", 2, 5),
    swing("HIGH", 3, 12), swing("LOW", 4, 6),
    swing("HIGH", 5, 11), swing("LOW", 6, 4),
  ];
  const snapshot = structuredClone(swings);
  const structure = classifyStructure(swings);
  assert.deepEqual(structure.map(({ index, structure }) => [index, structure]), [
    [3, "HH"], [4, "HL"], [5, "LH"], [6, "LL"],
  ]);
  assert.equal(structure[0].candle, swings[2].candle);
  assert.deepEqual(swings, snapshot);
});

it("preserves consecutive same-type comparisons and existing equal-price behavior", () => {
  assert.deepEqual(classifyStructure([]), []);
  assert.deepEqual(classifyStructure([swing("HIGH", 1, 10)]), []);
  assert.deepEqual(classifyStructure([
    swing("HIGH", 1, 10), swing("HIGH", 2, 10),
    swing("LOW", 3, 5), swing("LOW", 4, 5),
  ]).map((event) => event.structure), ["LH", "LL"]);
});

it("includes the source candle for both existing CHoCH transitions", () => {
  for (const [previous, current, direction] of [["HL", "LL", "BEARISH"], ["LH", "HH", "BULLISH"]]) {
    const candle = { high: 12, low: 4 };
    assert.deepEqual(detectCHOCH([
      { structure: previous }, { structure: current, index: 7, candle },
    ]), [{ direction, index: 7, candle }]);
  }
  assert.deepEqual(detectCHOCH([{ structure: "HL" }, { structure: "HH" }]), []);
});

it("BOS requires a close beyond the level, has consistent references and break order", () => {
  const candles = [
    { close: 7 }, { close: 7 }, { close: 4, high: 11 },
    { close: 10 }, { close: 11 }, { close: 12 },
  ];
  const bos = detectBOS(candles, [swing("HIGH", 0, 10), swing("LOW", 1, 5)]);
  assert.deepEqual(bos.map(({ direction, breakIndex, brokenSwing }) => ({ direction, breakIndex, brokenSwing })), [
    { direction: "BEARISH", breakIndex: 2, brokenSwing: 1 },
    { direction: "BULLISH", breakIndex: 4, brokenSwing: 0 },
  ]);
  assert.equal(bos[1].brokenSwings, 0, "legacy bullish field remains available");
});

it("retains strict three-candle swing detection", () => {
  const candles = [{ high: 10, low: 5 }, { high: 12, low: 4 }, { high: 11, low: 6 }];
  assert.deepEqual(detectSwings(candles), [
    { type: "HIGH", index: 1, candle: candles[1] },
    { type: "LOW", index: 1, candle: candles[1] },
  ]);
});

it("preserves equal-level pairs and calculates previous-day liquidity", () => {
  const swings = [swing("HIGH", 1, 100), swing("LOW", 2, 50), swing("HIGH", 3, 100.01), swing("LOW", 4, 50.01)];
  const candles = [
    { time: Date.UTC(2026, 0, 1), high: 100, low: 50 },
    { time: Date.UTC(2026, 0, 1, 12), high: 110, low: 40 },
    { time: Date.UTC(2026, 0, 2), high: 120, low: 60 },
  ];
  const liquidity = detectLiquidity(swings, candles);
  assert.deepEqual(liquidity.equalHighs, [{ first: swings[0], second: swings[2] }]);
  assert.deepEqual(liquidity.equalLows, [{ first: swings[1], second: swings[3] }]);
  assert.deepEqual(liquidity.previousDayLiquidity[2], {
    time: candles[2].time, pdh: 110, pdl: 40, previousDay: "2026-01-01",
  });
});
