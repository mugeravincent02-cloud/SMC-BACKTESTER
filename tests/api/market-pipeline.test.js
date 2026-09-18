const { after, before, beforeEach, describe, it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const axios = require("axios");
const DataCleaner = require("../../server/market/DataCleaner");
const app = require("../../server/app");

const rawCandles = [
  [Date.UTC(2026, 0, 1), "10", "12", "8", "11", "20", 1767311999999, "210", 4, "10", "105", "0"],
  [Date.UTC(2026, 0, 2), "11", "13", "9", "12", "0", 1767398399999, "0", 0, "0", "0", "0"],
];
const expectedCandles = [
  { time: rawCandles[0][0], open: 10, high: 12, low: 8, close: 11, volume: 20 },
  { time: rawCandles[1][0], open: 11, high: 13, low: 9, close: 12, volume: 0 },
];
const publicError = { success: false, message: "Unavailable to fetch market data." };

describe("complete market pipeline (only Axios is stubbed)", () => {
  let server;
  let baseURL;
  let get;

  before(async () => {
    get = mock.method(axios, "get", async () => ({ data: rawCandles }));
    mock.method(console, "error", () => {});
    server = app.listen(0, "127.0.0.1");
    await once(server, "listening");
    baseURL = `http://127.0.0.1:${server.address().port}`;
  });

  beforeEach(() => {
    get.mock.mockImplementation(async () => ({ data: rawCandles }));
    get.mock.resetCalls();
  });

  after(async () => {
    if (server) await new Promise((resolve) => server.close(resolve));
    mock.restoreAll();
  });

  async function request(query = "", status = 200) {
    const response = await fetch(`${baseURL}/api/candles${query}`, { signal: AbortSignal.timeout(3000) });
    assert.equal(response.status, status, query);
    assert.match(response.headers.get("content-type"), /application\/json/);
    return response.json();
  }

  it("runs BTCUSDT through validation, provider, cleaner and the existing success envelope", async () => {
    const body = await request("?symbol=BTCUSDT&interval=1h&limit=100");
    assert.deepEqual(Object.keys(body).sort(), ["data", "interval", "success", "symbol", "timestamp", "total"]);
    assert.deepEqual({ ...body, timestamp: "checked" }, {
      success: true, timestamp: "checked", symbol: "BTCUSDT", interval: "1h", total: 2, data: expectedCandles,
    });
    assert.equal(new Date(body.timestamp).toISOString(), body.timestamp);
    assert.deepEqual(get.mock.calls[0].arguments, [
      "https://api.binance.com/api/v3/klines",
      { timeout: 8000, params: { symbol: "BTCUSDT", interval: "1h", limit: 100 } },
    ]);
    assert.equal(get.mock.callCount(), 1);
  });

  it("defaults omitted parameters and keeps symbols configurable", async () => {
    assert.equal((await request()).symbol, "BTCUSDT");
    const body = await request("?symbol=ETHUSDT&interval=5m&limit=50");
    assert.equal(body.symbol, "ETHUSDT");
    assert.equal(body.interval, "5m");
    assert.deepEqual(get.mock.calls.at(-1).arguments[1].params, { symbol: "ETHUSDT", interval: "5m", limit: 50 });
  });

  it("accepts every existing interval and retains numeric limit normalization", async () => {
    for (const interval of ["1m", "3m", "5m", "15m", "30m", "1h", "2h", "4h", "6h", "8h", "12h", "1d", "3d", "1w", "1M"]) {
      await request(`?interval=${interval}`);
      assert.equal(get.mock.calls.at(-1).arguments[1].params.interval, interval);
    }
    for (const [text, limit] of [["1", 1], ["1000", 1000], ["0010", 10], ["100.0", 100], ["1e2", 100], ["0x64", 100], ["%20100%20", 100]]) {
      await request(`?limit=${text}`);
      assert.equal(get.mock.calls.at(-1).arguments[1].params.limit, limit);
    }
  });

  it("rejects invalid symbols, intervals and limits without an Axios request", async () => {
    const cases = [
      ["symbol=", "Invalid symbol format"], ["symbol=btcusdt", "Invalid symbol format"],
      ["symbol=BTC%2FUSDT", "Invalid symbol format"], ["symbol=BTCUSDT%0A", "Invalid symbol format"],
      ["symbol=BTCUSDT&symbol=ETHUSDT", "Invalid symbol format"],
      ["interval=", "Invalid interval"], ["interval=1H", "Invalid interval"],
      ["interval=1s", "Invalid interval"], ["interval=1h&interval=5m", "Invalid interval"],
    ];
    for (const limit of ["", "0", "-1", "1001", "1.5", "abc", "Infinity", "NaN", "100&limit=100"]) {
      cases.push([`limit=${limit}`, "Limit must be an integer between 1 and 1000."]);
    }
    for (const [query, message] of cases) {
      assert.deepEqual(await request(`?${query}`, 400), { success: false, message });
    }
    assert.equal(get.mock.callCount(), 0);
  });

  it("returns success with total zero for a genuine empty provider array", async () => {
    get.mock.mockImplementation(async () => ({ data: [] }));
    const body = await request();
    assert.equal(body.success, true);
    assert.equal(body.total, 0);
    assert.deepEqual(body.data, []);
    assert.equal(body.symbol, "BTCUSDT");
    assert.equal(body.interval, "1h");
    assert.ok(Number.isFinite(Date.parse(body.timestamp)));
  });

  it("returns sanitized JSON for malformed provider responses", async () => {
    for (const data of [null, undefined, {}, "private provider body", false, 7, { code: -1121, msg: "private provider detail" }]) {
      get.mock.mockImplementation(async () => ({ data }));
      assert.deepEqual(await request("", 500), publicError);
    }
  });

  it("rejects malformed candles and never returns partial successful data", async () => {
    for (const candle of [null, {}, [], rawCandles[1].slice(0, 5), [rawCandles[1][0], "bad", "13", "9", "12", "0"], [rawCandles[1][0], "11", "13", "-1", "12", "0"], [rawCandles[1][0], "11", "13", "9", "12", "-1"]]) {
      get.mock.mockImplementation(async () => ({ data: [rawCandles[0], candle] }));
      assert.deepEqual(await request("", 500), publicError);
    }
  });

  it("rejects sparse provider arrays instead of serializing missing candles as null", async () => {
    const data = [rawCandles[0]];
    delete data[0];
    get.mock.mockImplementation(async () => ({ data }));
    assert.deepEqual(await request("", 500), publicError);
  });

  it("rejects duplicates and unordered candles without sorting or altering input", async () => {
    for (const data of [[rawCandles[0], rawCandles[0]], [...rawCandles].reverse()]) {
      const snapshot = structuredClone(data);
      get.mock.mockImplementation(async () => ({ data }));
      assert.deepEqual(await request("", 500), publicError);
      assert.deepEqual(data, snapshot);
    }
  });

  it("sanitizes transport, timeout and provider HTTP errors without retrying", async () => {
    for (const error of [
      new Error("private network detail"),
      Object.assign(new Error("private timeout detail"), { code: "ECONNABORTED" }),
      ...[400, 429, 500].map((status) => Object.assign(new Error("private provider detail"), { response: { status, data: { msg: "private body" } } })),
    ]) {
      get.mock.mockImplementation(async () => { throw error; });
      const calls = get.mock.callCount();
      assert.deepEqual(await request("", 500), publicError);
      assert.equal(get.mock.callCount(), calls + 1);
    }
    get.mock.mockImplementation(async () => ({ data: rawCandles }));
    assert.deepEqual((await request()).data, expectedCandles);
  });

  it("does not expose unexpected controller dependency exception messages or stacks", async (t) => {
    t.mock.method(DataCleaner, "cleanCandles", () => { throw new Error("private controller dependency detail\nstack sentinel"); });
    assert.deepEqual(await request("", 500), publicError);
  });
});
