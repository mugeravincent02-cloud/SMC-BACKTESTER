const { after, before, describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const BinanceService = require("../../server/market/BinanceService");
const app = require("../../server/app");

const rawCandles = [
  [Date.UTC(2026, 0, 1), "10", "12", "8", "11", "20"],
  [Date.UTC(2026, 0, 2), "11", "13", "9", "12", "30"],
];

describe("market API regressions (stubbed provider, no network dependency)", () => {
  let server;
  let baseURL;
  let provider;

  before(async () => {
    provider = mock.method(BinanceService, "fetchCandles", async () => rawCandles);
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseURL = `http://127.0.0.1:${server.address().port}`;
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    mock.restoreAll();
  });

  async function request(path, status) {
    const response = await fetch(baseURL + path);
    assert.equal(response.status, status);
    assert.match(response.headers.get("content-type"), /application\/json/);
    return response.json();
  }

  for (const endpoint of ["/api/candles", "/api/smc/swings"]) {
    it(`${endpoint}: applies existing defaults`, async () => {
      const body = await request(endpoint, 200);
      assert.equal(body.success, true);
      assert.deepEqual(provider.mock.calls.at(-1).arguments, ["BTCUSDT", "1h", 100]);
    });

    it(`${endpoint}: forwards validated selections with numeric limits`, async () => {
      await request(`${endpoint}?symbol=ETHUSDT&interval=5m&limit=50`, 200);
      assert.deepEqual(provider.mock.calls.at(-1).arguments, ["ETHUSDT", "5m", 50]);
    });

    it(`${endpoint}: accepts both limit boundaries`, async () => {
      for (const limit of [1, 1000]) {
        await request(`${endpoint}?limit=${limit}`, 200);
        assert.equal(provider.mock.calls.at(-1).arguments[2], limit);
      }
    });

    it(`${endpoint}: rejects invalid queries before contacting the provider`, async () => {
      const callCount = provider.mock.callCount();
      for (const query of [
        "limit=0", "limit=-1", "limit=1001", "limit=1.5", "limit=abc", "limit=",
        "limit=10&limit=20", "symbol=", "symbol=btc/usdt",
        "symbol=BTCUSDT&symbol=ETHUSDT", "interval=bad", "interval=1h&interval=5m",
      ]) {
        const body = await request(`${endpoint}?${query}`, 400);
        assert.equal(body.success, false, query);
        assert.equal(typeof body.message, "string");
      }
      assert.equal(provider.mock.callCount(), callCount);
    });
  }

  it("returns cleaned market candles with the existing response shape", async () => {
    const body = await request("/api/candles", 200);
    assert.equal(body.symbol, "BTCUSDT");
    assert.equal(body.interval, "1h");
    assert.equal(body.total, 2);
    assert.deepEqual(body.data[0], {
      time: Date.UTC(2026, 0, 1), open: 10, high: 12, low: 8, close: 11, volume: 20,
    });
  });

  it("passes candles into previous-day liquidity through the SMC route", async () => {
    const body = await request("/api/smc/swings", 200);
    assert.deepEqual(body.liquidity.previousDayLiquidity, [
      { time: Date.UTC(2026, 0, 1), pdh: null, pdl: null, previousDay: null },
      { time: Date.UTC(2026, 0, 2), pdh: 12, pdl: 8, previousDay: "2026-01-01" },
    ]);
    for (const field of ["swings", "structure", "bos", "choch"]) {
      assert.ok(Array.isArray(body[field]));
    }
  });

  it("returns JSON on provider failures and recovers on the next request", async () => {
    const logging = mock.method(console, "error", () => {});
    try {
      provider.mock.mockImplementation(async () => { throw new Error("Unavailable to fetch market data."); });
      for (const endpoint of ["/api/candles", "/api/smc/swings"]) {
        const body = await request(endpoint, 500);
        assert.equal(body.success, false);
        assert.equal(body.message, "Unavailable to fetch market data.");
      }
    } finally {
      provider.mock.mockImplementation(async () => rawCandles);
      logging.mock.restore();
    }
    assert.equal((await request("/api/candles", 200)).total, 2);
  });
});
