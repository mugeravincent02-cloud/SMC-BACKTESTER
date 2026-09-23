const { it } = require("node:test");
const assert = require("node:assert/strict");

const {
  detectFairValueGaps,
} = require("../../server/smc/FairValueGapDetector");
const { detectPOIs } = require("../../server/smc/POIDetector");
const { combineHTFLTF } = require("../../server/smc/HTFLTFAnalyzer");
const { validateEntry } = require("../../server/smc/EntryValidator");

it("detects historical-only bullish and bearish fair value gaps", () => {
  const candles = [
    { time: 1, open: 10, high: 11, low: 9, close: 10 },
    { time: 2, open: 10.1, high: 10.8, low: 9.9, close: 10.2 },
    { time: 3, open: 10.3, high: 11.1, low: 12.1, close: 12.4 },
    { time: 4, open: 12.2, high: 12.7, low: 11.8, close: 12.1 },
    { time: 5, open: 12, high: 11.1, low: 8.5, close: 8.7 },
    { time: 6, open: 8.8, high: 9.2, low: 8.4, close: 8.9 },
  ];

  const gaps = detectFairValueGaps(candles);

  assert.deepEqual(
    gaps.map(({ direction, startIndex, endIndex }) => ({
      direction,
      startIndex,
      endIndex,
    })),
    [
      { direction: "BULLISH", startIndex: 1, endIndex: 2 },
      { direction: "BEARISH", startIndex: 3, endIndex: 4 },
    ],
  );
});

it("keeps only valid directional points of interest", () => {
  const poi = detectPOIs([
    { direction: "BULLISH", type: "FVG", low: 99.8, high: 101.2, index: 2 },
    { direction: "BEARISH", type: "FVG", low: 98.4, high: 100.2, index: 5 },
    { direction: "BULLISH", type: "LIQUIDITY", level: 100, index: 7 },
    { direction: "BULLISH", type: "STRUCTURE", level: 101.4, index: 9 },
    { direction: "INVALID", type: "FVG", low: 1, high: 2, index: 3 },
    { direction: "BEARISH", type: "LIQUIDITY", level: null, index: 11 },
  ]);

  assert.deepEqual(
    poi.map(({ direction, type }) => ({ direction, type })),
    [
      { direction: "BULLISH", type: "FVG" },
      { direction: "BEARISH", type: "FVG" },
      { direction: "BULLISH", type: "LIQUIDITY" },
      { direction: "BULLISH", type: "STRUCTURE" },
    ],
  );
});

it("aligns HTF and LTF context only when the directional bias agrees", () => {
  const htfltf = combineHTFLTF(
    [{ direction: "BULLISH", level: 100.5, index: 10 }],
    [{ direction: "BULLISH", level: 101.1, index: 2 }],
  );

  assert.equal(htfltf.aligned, true);
  assert.equal(htfltf.direction, "BULLISH");
  assert.equal(htfltf.htf.direction, "BULLISH");
  assert.equal(htfltf.ltf.direction, "BULLISH");
});

it("validates bullish entries when the risk, POI and confluence checks align", () => {
  const result = validateEntry({
    direction: "BULLISH",
    entry: 100.5,
    stop: 99.2,
    takeProfit: 106.4,
    support: 99.6,
    poi: { direction: "BULLISH", level: 100.2 },
    htfLtf: { aligned: true, direction: "BULLISH" },
  });

  assert.equal(result.valid, true);
  assert.equal(result.direction, "BULLISH");
  assert.equal(result.checks.hasValidPOI, true);
  assert.equal(result.checks.hasConfluence, true);
});
