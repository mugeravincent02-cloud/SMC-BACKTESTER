const { after, before, describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");

const BinanceService = require("../../server/market/BinanceService");
const {
  normalizeSmcOverlays,
} = require("../../server/smc/ChartOverlayBuilder");
const app = require("../../server/app");

const rawCandles = [
  [Date.UTC(2026, 0, 1), "10", "12", "8", "11", "20"],
  [Date.UTC(2026, 0, 2), "11", "13", "9", "12", "30"],
  [Date.UTC(2026, 0, 3), "12", "15", "10", "13", "40"],
  [Date.UTC(2026, 0, 4), "13", "16", "11", "14", "50"],
];

describe("SMC API contract", () => {
  let server;
  let baseURL;
  let provider;

  before(async () => {
    provider = mock.method(
      BinanceService,
      "fetchCandles",
      async () => rawCandles,
    );
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseURL = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    mock.restoreAll();
  });

  async function request(path) {
    const response = await fetch(baseURL + path);
    assert.equal(response.status, 200);
    return response.json();
  }

  it("returns a full SMC payload with overlays for the chart", async () => {
    const body = await request(
      "/api/smc/swings?symbol=BTCUSDT&interval=1h&limit=4",
    );
    assert.equal(body.success, true);
    assert.equal(body.symbol, "BTCUSDT");
    assert.equal(body.interval, "1h");
    assert.equal(body.total, 4);
    assert.ok(Array.isArray(body.data));
    assert.ok(Array.isArray(body.swings));
    assert.ok(Array.isArray(body.structure));
    assert.ok(Array.isArray(body.bos));
    assert.ok(Array.isArray(body.choch));
    assert.ok(body.liquidity && typeof body.liquidity === "object");
    assert.ok(Array.isArray(body.fvg));
    assert.ok(Array.isArray(body.orderBlocks));
    assert.ok(Array.isArray(body.pois));
    assert.ok(body.overlays && typeof body.overlays === "object");
    assert.ok(Array.isArray(body.overlays.fvg));
    assert.ok(Array.isArray(body.overlays.bos));
    assert.ok(Array.isArray(body.overlays.choch));
    assert.ok(Array.isArray(body.overlays.liquidity));
    assert.ok(Array.isArray(body.overlays.orderBlocks));
    assert.ok(Array.isArray(body.overlays.pois));
  });

  it("returns empty arrays for valid but empty detector results", async () => {
    const body = await request(
      "/api/smc/swings?symbol=BTCUSDT&interval=1h&limit=3",
    );
    assert.ok(Array.isArray(body.swings));
    assert.ok(Array.isArray(body.structure));
    assert.ok(Array.isArray(body.bos));
    assert.ok(Array.isArray(body.choch));
    assert.ok(Array.isArray(body.fvg));
    assert.ok(Array.isArray(body.orderBlocks));
    assert.ok(Array.isArray(body.pois));
    assert.ok(Array.isArray(body.overlays.fvg));
    assert.ok(Array.isArray(body.overlays.bos));
    assert.ok(Array.isArray(body.overlays.choch));
    assert.ok(Array.isArray(body.overlays.liquidity));
    assert.ok(Array.isArray(body.overlays.orderBlocks));
    assert.ok(Array.isArray(body.overlays.pois));
  });

  it("preserves second-based timestamps when normalizing overlays", () => {
    const candles = [
      { time: 1_700_000_000_000 },
      { time: 1_700_000_360_000 },
      { time: 1_700_000_720_000 },
    ];

    const overlays = normalizeSmcOverlays(
      {
        bos: [
          {
            direction: "BULLISH",
            breakIndex: 1,
            level: 101,
            breakPrice: 101,
            time: 1_700_000_360,
          },
        ],
        choch: [
          {
            direction: "BULLISH",
            breakIndex: 1,
            level: 99,
            breakPrice: 99,
            time: 1_700_000_360,
          },
        ],
        fvg: [
          {
            direction: "BULLISH",
            startIndex: 0,
            endIndex: 1,
            startPrice: 100,
            endPrice: 102,
          },
        ],
        orderBlocks: [
          {
            direction: "BULLISH",
            startIndex: 0,
            low: 98,
            high: 104,
          },
        ],
        pois: [
          {
            direction: "BULLISH",
            startIndex: 1,
            level: 100,
          },
        ],
        liquidity: {
          previousDayLiquidity: [{ pdl: 100, time: 1_700_000_360 }],
        },
      },
      candles,
    );

    assert.equal(overlays.bos[0].time, 1_700_000_360);
    assert.equal(overlays.choch[0].time, 1_700_000_360);
    assert.equal(overlays.fvg[0].startTime, 1_700_000_000);
    assert.equal(overlays.fvg[0].endTime, 1_700_000_720);
    assert.equal(overlays.fvg[0].sourceIndex, 0);
    assert.equal(overlays.fvg[0].confirmationIndex, 1);
    assert.equal(overlays.bos[0].sourceIndex, 0);
    assert.equal(overlays.bos[0].confirmationIndex, 1);
    assert.equal(overlays.liquidity[0].level, 100);
    assert.equal(overlays.orderBlocks[0].startTime, 1_700_000_000);
    assert.equal(overlays.pois[0].startTime, 1_700_000_360);
    assert.ok(overlays.pois[0].low < overlays.pois[0].high);
  });
});
