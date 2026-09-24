const { it } = require("node:test");
const assert = require("node:assert/strict");
const { classifyStructure } = require("../../server/smc/StructureDetector");
const { detectCHOCH } = require("../../server/smc/CHOCHDetector");
const { detectBOS } = require("../../server/smc/BOSDetector");
const { detectSwings } = require("../../server/smc/SwingDetector");
const { detectLiquidity } = require("../../server/smc/LiquidityDetector");
const { detectOrderBlocks } = require("../../server/smc/OrderBlockDetector");

function candle(high, low, close) {
  return { high, low, close };
}

function bullishCandles(breakClose = 15) {
  return [
    candle(10, 5, 8),
    candle(12, 7, 10),
    candle(11, 6, 8),
    candle(10, 4, 6),
    candle(11, 5, 8),
    candle(14, 7, 12),
    candle(13, 6, 9),
    candle(12, 5, 8),
    candle(13, 6, 10),
    candle(15, 7, breakClose),
  ];
}

function bearishCandles(breakClose = 5) {
  return [
    candle(15, 10, 12),
    candle(14, 8, 10),
    candle(15, 9, 12),
    candle(20, 11, 18),
    candle(17, 10, 13),
    candle(16, 6, 8),
    candle(17, 7, 12),
    candle(18, 9, 16),
    candle(17, 8, 12),
    candle(16, 5, breakClose),
  ];
}

it("detects confirmed deterministic swings with their source candles", () => {
  const candles = bullishCandles();
  assert.deepEqual(
    detectSwings(candles).map(
      ({ type, index, confirmationIndex, candle: source }) => [
        type,
        index,
        confirmationIndex,
        source,
      ],
    ),
    [
      ["HIGH", 1, 2, candles[1]],
      ["LOW", 3, 4, candles[3]],
      ["HIGH", 5, 6, candles[5]],
      ["LOW", 7, 8, candles[7]],
    ],
  );
});

it("classifies bullish and bearish structure using the preceding same-type swing", () => {
  const bullish = classifyStructure(detectSwings(bullishCandles()));
  const bearish = classifyStructure(detectSwings(bearishCandles()));

  assert.deepEqual(
    bullish.map(({ index, structure }) => [index, structure]),
    [
      [5, "HH"],
      [7, "HL"],
    ],
  );
  assert.deepEqual(
    bearish.map(({ index, structure }) => [index, structure]),
    [
      [5, "LL"],
      [7, "LH"],
    ],
  );
});

it("emits only a bullish BOS after bullish structure is confirmed", () => {
  const candles = bullishCandles();
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);
  const bos = detectBOS(candles, swings, structure);

  assert.deepEqual(
    bos.map(({ direction, brokenSwing, breakIndex, breakPrice }) => ({
      direction,
      brokenSwing,
      breakIndex,
      breakPrice,
    })),
    [{ direction: "BULLISH", brokenSwing: 5, breakIndex: 9, breakPrice: 15 }],
  );
  assert.equal(bos[0].brokenSwingCandle, candles[5]);
  assert.equal(
    bos[0].brokenSwings,
    5,
    "legacy bullish field remains available",
  );
});

it("returns BOS events in candle order when later confirmed highs break", () => {
  const candles = [
    ...bullishCandles(),
    candle(14, 8, 10),
    candle(13, 7, 9),
    candle(16, 9, 16),
  ];
  const swings = detectSwings(candles);
  const bos = detectBOS(candles, swings, classifyStructure(swings));
  assert.deepEqual(
    bos.map(({ brokenSwing, breakIndex }) => [brokenSwing, breakIndex]),
    [
      [5, 9],
      [9, 12],
    ],
  );
});

it("emits only a bearish BOS after bearish structure is confirmed", () => {
  const candles = bearishCandles();
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);
  const bos = detectBOS(candles, swings, structure);

  assert.deepEqual(
    bos.map(({ direction, brokenSwing, breakIndex, breakPrice }) => ({
      direction,
      brokenSwing,
      breakIndex,
      breakPrice,
    })),
    [{ direction: "BEARISH", brokenSwing: 5, breakIndex: 9, breakPrice: 5 }],
  );
  assert.equal(bos[0].brokenSwingCandle, candles[5]);
});

it("treats a protected opposing-swing break as CHoCH, not BOS", () => {
  const candles = bullishCandles(4);
  const swings = detectSwings(candles);
  const structure = classifyStructure(swings);

  assert.deepEqual(detectBOS(candles, swings, structure), []);
  assert.deepEqual(
    detectCHOCH(candles, structure).map(
      ({
        direction,
        brokenStructure,
        breakIndex,
        breakPrice,
        candle: source,
      }) => ({ direction, brokenStructure, breakIndex, breakPrice, source }),
    ),
    [
      {
        direction: "BEARISH",
        brokenStructure: 7,
        breakIndex: 9,
        breakPrice: 4,
        source: candles[9],
      },
    ],
  );
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
  assert.deepEqual(
    detectSwings([
      { high: 10, low: 5 },
      { high: 11, low: 4 },
    ]),
    [],
  );
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
  assert.deepEqual(liquidity.equalHighs, [
    { first: swings[0], second: swings[2] },
  ]);
  assert.deepEqual(liquidity.equalLows, [
    { first: swings[1], second: swings[3] },
  ]);
});

it("adds stage04 liquidity core checks for tolerance, swing levels and calendar windows", () => {
  const swings = [
    {
      type: "HIGH",
      index: 1,
      candle: { time: Date.UTC(2026, 0, 1, 8), high: 100 },
    },
    {
      type: "LOW",
      index: 2,
      candle: { time: Date.UTC(2026, 0, 1, 9), low: 50 },
    },
    {
      type: "HIGH",
      index: 3,
      candle: { time: Date.UTC(2026, 0, 2, 8), high: 100.05 },
    },
    {
      type: "LOW",
      index: 4,
      candle: { time: Date.UTC(2026, 0, 2, 9), low: 49.975 },
    },
    {
      type: "HIGH",
      index: 5,
      candle: { time: Date.UTC(2026, 0, 4, 8), high: 110 },
    },
    {
      type: "LOW",
      index: 6,
      candle: { time: Date.UTC(2026, 0, 4, 9), low: 45 },
    },
  ];

  const candles = [
    { time: Date.UTC(2026, 0, 1, 0), high: 101, low: 48, close: 99 },
    { time: Date.UTC(2026, 0, 1, 6), high: 102, low: 49, close: 100 },
    { time: Date.UTC(2026, 0, 2, 0), high: 100.04, low: 49.95, close: 100.02 },
    { time: Date.UTC(2026, 0, 2, 6), high: 100.06, low: 49.94, close: 100.05 },
    { time: Date.UTC(2026, 0, 3, 0), high: 109, low: 44, close: 108 },
    { time: Date.UTC(2026, 0, 4, 0), high: 111, low: 45, close: 110 },
    { time: Date.UTC(2026, 0, 4, 6), high: 112, low: 46, close: 111 },
  ];

  const liquidity = detectLiquidity(swings, candles, {
    sessionConfig: {
      timezone: "UTC",
      sessionStart: "00:00",
      sessionEnd: "23:59:59",
    },
  });

  assert.deepEqual(
    liquidity.equalHighs.map(({ first, second }) => [
      first.index,
      second.index,
    ]),
    [[1, 3]],
  );
  assert.deepEqual(
    liquidity.equalLows.map(({ first, second }) => [first.index, second.index]),
    [[2, 4]],
  );
  assert.deepEqual(
    liquidity.swingLiquidity.highs.map(({ index }) => index),
    [1, 3, 5],
  );
  assert.deepEqual(
    liquidity.swingLiquidity.lows.map(({ index }) => index),
    [2, 4, 6],
  );
  assert.deepEqual(
    liquidity.previousDayLiquidity.map(({ time, pdh, pdl }) => [
      time,
      pdh,
      pdl,
    ]),
    [
      [Date.UTC(2026, 0, 1, 0), null, null],
      [Date.UTC(2026, 0, 1, 6), null, null],
      [Date.UTC(2026, 0, 2, 0), 102, 48],
      [Date.UTC(2026, 0, 2, 6), 102, 48],
      [Date.UTC(2026, 0, 3, 0), 100.06, 49.94],
      [Date.UTC(2026, 0, 4, 0), 109, 44],
      [Date.UTC(2026, 0, 4, 6), 109, 44],
    ],
  );
  assert.deepEqual(
    liquidity.previousWeekLiquidity.map(({ time, pwh, pwl }) => [
      time,
      pwh,
      pwl,
    ]),
    [
      [Date.UTC(2026, 0, 1, 0), null, null],
      [Date.UTC(2026, 0, 1, 6), null, null],
      [Date.UTC(2026, 0, 2, 0), null, null],
      [Date.UTC(2026, 0, 2, 6), null, null],
      [Date.UTC(2026, 0, 3, 0), null, null],
      [Date.UTC(2026, 0, 4, 0), null, null],
      [Date.UTC(2026, 0, 4, 6), null, null],
    ],
  );
  assert.deepEqual(
    liquidity.sessionLiquidity.map(({ time, sessionHigh, sessionLow }) => [
      time,
      sessionHigh,
      sessionLow,
    ]),
    [
      [Date.UTC(2026, 0, 1, 0), 101, 48],
      [Date.UTC(2026, 0, 1, 6), 102, 48],
      [Date.UTC(2026, 0, 2, 0), 100.04, 49.95],
      [Date.UTC(2026, 0, 2, 6), 100.06, 49.94],
      [Date.UTC(2026, 0, 3, 0), 109, 44],
      [Date.UTC(2026, 0, 4, 0), 111, 45],
      [Date.UTC(2026, 0, 4, 6), 112, 45],
    ],
  );
});

it("detects bullish and bearish liquidity sweeps with reclaim confirmation", () => {
  const candles = [
    {
      time: Date.UTC(2026, 0, 1, 0),
      open: 100,
      high: 110,
      low: 95,
      close: 108,
    },
    {
      time: Date.UTC(2026, 0, 1, 1),
      open: 108,
      high: 109,
      low: 96,
      close: 100,
    },
    {
      time: Date.UTC(2026, 0, 1, 2),
      open: 100,
      high: 101,
      low: 98,
      close: 100,
    },
    {
      time: Date.UTC(2026, 0, 1, 3),
      open: 100,
      high: 104,
      low: 99,
      close: 103,
    },
    {
      time: Date.UTC(2026, 0, 1, 4),
      open: 103,
      high: 118,
      low: 103,
      close: 117,
    },
    {
      time: Date.UTC(2026, 0, 1, 5),
      open: 117,
      high: 121,
      low: 114,
      close: 119,
    },
    { time: Date.UTC(2026, 0, 1, 6), open: 119, high: 120, low: 92, close: 94 },
    { time: Date.UTC(2026, 0, 1, 7), open: 94, high: 125, low: 90, close: 123 },
    {
      time: Date.UTC(2026, 0, 1, 8),
      open: 123,
      high: 128,
      low: 116,
      close: 118,
    },
    { time: Date.UTC(2026, 0, 1, 9), open: 118, high: 119, low: 88, close: 88 },
  ];

  const swings = [
    { type: "LOW", index: 1, candle: { low: 100, time: candles[1].time } },
    { type: "HIGH", index: 6, candle: { high: 120, time: candles[6].time } },
  ];

  const liquidity = detectLiquidity(swings, candles);

  assert.deepEqual(
    liquidity.sweeps.map(
      ({
        direction,
        type,
        level,
        sweepCandleIndex,
        reclaimed,
        confirmationIndex,
      }) => ({
        direction,
        type,
        level,
        sweepCandleIndex,
        reclaimed,
        confirmationIndex,
      }),
    ),
    [
      {
        direction: "BULLISH",
        type: "SSL",
        level: 100,
        sweepCandleIndex: 2,
        reclaimed: true,
        confirmationIndex: 3,
      },
      {
        direction: "BEARISH",
        type: "BSL",
        level: 120,
        sweepCandleIndex: 7,
        reclaimed: true,
        confirmationIndex: 8,
      },
    ],
  );
});

it("records failed sweeps without reclaim confirmation", () => {
  const candles = [
    { time: Date.UTC(2026, 0, 2, 0), high: 110, low: 90, close: 105 },
    { time: Date.UTC(2026, 0, 2, 1), high: 111, low: 89, close: 95 },
    { time: Date.UTC(2026, 0, 2, 2), high: 96, low: 88, close: 90 },
    { time: Date.UTC(2026, 0, 2, 3), high: 92, low: 87, close: 89 },
  ];

  const swings = [
    { type: "LOW", index: 0, candle: { low: 90, time: candles[0].time } },
  ];
  const liquidity = detectLiquidity(swings, candles);

  assert.deepEqual(
    liquidity.sweeps.map(
      ({ direction, type, reclaimed, confirmationIndex }) => ({
        direction,
        type,
        reclaimed,
        confirmationIndex,
      }),
    ),
    [
      {
        direction: "BULLISH",
        type: "SSL",
        reclaimed: false,
        confirmationIndex: null,
      },
    ],
  );
});

it("detects bullish and bearish order blocks after a directional shift", () => {
  const candles = [
    {
      time: Date.UTC(2026, 0, 1, 0),
      open: 100,
      high: 108,
      low: 97,
      close: 103,
    },
    { time: Date.UTC(2026, 0, 1, 1), open: 103, high: 106, low: 95, close: 99 },
    { time: Date.UTC(2026, 0, 1, 2), open: 99, high: 112, low: 98, close: 110 },
    {
      time: Date.UTC(2026, 0, 1, 3),
      open: 110,
      high: 115,
      low: 106,
      close: 111,
    },
    {
      time: Date.UTC(2026, 0, 1, 4),
      open: 111,
      high: 120,
      low: 109,
      close: 119,
    },
    {
      time: Date.UTC(2026, 0, 1, 5),
      open: 119,
      high: 122,
      low: 116,
      close: 118,
    },
    {
      time: Date.UTC(2026, 0, 1, 6),
      open: 118,
      high: 121,
      low: 106,
      close: 108,
    },
    {
      time: Date.UTC(2026, 0, 1, 7),
      open: 108,
      high: 109,
      low: 100,
      close: 102,
    },
    { time: Date.UTC(2026, 0, 1, 8), open: 102, high: 104, low: 92, close: 94 },
    { time: Date.UTC(2026, 0, 1, 9), open: 94, high: 96, low: 88, close: 90 },
  ];

  const blocks = detectOrderBlocks(candles);

  assert.deepEqual(
    blocks.map(({ direction, zoneHigh, zoneLow, index, candleIndex }) => ({
      direction,
      zoneHigh,
      zoneLow,
      index,
      candleIndex,
    })),
    [
      {
        direction: "BULLISH",
        zoneHigh: 112,
        zoneLow: 98,
        index: 2,
        candleIndex: 2,
      },
      {
        direction: "BEARISH",
        zoneHigh: 121,
        zoneLow: 106,
        index: 6,
        candleIndex: 6,
      },
    ],
  );
});

it("ignores invalid order-block patterns and insufficient candle history", () => {
  assert.deepEqual(
    detectOrderBlocks([
      { time: 1, open: 10, high: 12, low: 9, close: 11 },
      { time: 2, open: 11, high: 13, low: 10, close: 12 },
      { time: 3, open: 12, high: 14, low: 11, close: 13 },
    ]),
    [],
  );

  assert.deepEqual(detectOrderBlocks([]), []);
  assert.deepEqual(
    detectOrderBlocks([{ time: 1, open: 10, high: 12, low: 8, close: 11 }]),
    [],
  );
});

it("does not create overlapping order-block zones", () => {
  const candles = [
    {
      time: Date.UTC(2026, 0, 1, 0),
      open: 100,
      high: 103,
      low: 96,
      close: 101,
    },
    { time: Date.UTC(2026, 0, 1, 1), open: 101, high: 104, low: 95, close: 97 },
    { time: Date.UTC(2026, 0, 1, 2), open: 97, high: 110, low: 96, close: 108 },
    {
      time: Date.UTC(2026, 0, 1, 3),
      open: 108,
      high: 111,
      low: 105,
      close: 110,
    },
    {
      time: Date.UTC(2026, 0, 1, 4),
      open: 110,
      high: 113,
      low: 104,
      close: 106,
    },
    {
      time: Date.UTC(2026, 0, 1, 5),
      open: 106,
      high: 109,
      low: 98,
      close: 100,
    },
    { time: Date.UTC(2026, 0, 1, 6), open: 100, high: 102, low: 90, close: 92 },
    { time: Date.UTC(2026, 0, 1, 7), open: 92, high: 98, low: 88, close: 94 },
    { time: Date.UTC(2026, 0, 1, 8), open: 94, high: 97, low: 90, close: 96 },
  ];

  const blocks = detectOrderBlocks(candles);
  assert.deepEqual(
    blocks.map(({ direction, zoneLow, zoneHigh }) => ({
      direction,
      zoneLow,
      zoneHigh,
    })),
    [{ direction: "BULLISH", zoneLow: 96, zoneHigh: 110 }],
  );
});
