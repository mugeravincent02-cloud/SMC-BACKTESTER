const { it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { cleanCandles } = require("../../server/market/DataCleaner");
const { fetchCandles } = require("../../server/market/BinanceService");
const axios = require("axios");

const row = [Date.UTC(2026, 0, 1), "10", "12", "8", "11", "20"];

it("converts valid OHLCV without mutating source data", () => {
  const input = [row.slice()];
  const snapshot = structuredClone(input);
  assert.deepEqual(cleanCandles(input), [{
    time: row[0], open: 10, high: 12, low: 8, close: 11, volume: 20,
  }]);
  assert.deepEqual(input, snapshot);
  assert.deepEqual(cleanCandles([]), []);
});

it("rejects malformed rows and non-finite data before reaching charts", () => {
  for (const input of [null, {}, "candles"]) {
    assert.throws(() => cleanCandles(input), /Expected an array/);
  }
  for (const invalid of [
    null, {}, [], row.slice(0, 5),
    [row[0], "bad", "12", "8", "11", "20"],
    [row[0], "10", "Infinity", "8", "11", "20"],
    [row[0], "10", "12", "8", "11", null],
    [row[0], "10", "12", "8", "11", " "],
    [row[0], "10", "12", "8", "11", -1],
    ["bad", "10", "12", "8", "11", "20"],
    [8.7e15, "10", "12", "8", "11", "20"],
    [row[0], "10", "9", "8", "11", "20"],
    [row[0], "10", "12", "11", "11", "20"],
  ]) {
    assert.throws(() => cleanCandles([invalid]), /Invalid candle/);
  }
});

it("rejects duplicate or reversed timestamps instead of silently rearranging data", () => {
  assert.throws(() => cleanCandles([row, row]), /unique and increasing/);
  const earlier = [row[0] - 1000, ...row.slice(1)];
  assert.throws(() => cleanCandles([row, earlier]), /unique and increasing/);
  assert.equal(cleanCandles([earlier, row]).length, 2);
});

it("bounds provider requests and forwards request parameters", async () => {
  const get = mock.method(axios, "get", async () => ({ data: [row] }));
  try {
    assert.deepEqual(await fetchCandles("ETHUSDT", "5m", 50), [row]);
    const [url, options] = get.mock.calls[0].arguments;
    assert.equal(url, "https://api.binance.com/api/v3/klines");
    assert.deepEqual(options.params, { symbol: "ETHUSDT", interval: "5m", limit: 50 });
    assert.ok(options.timeout > 0 && options.timeout < 10000);
  } finally {
    get.mock.restore();
  }
});

it("converts provider failures to the existing public error message", async () => {
  const get = mock.method(axios, "get", async () => { throw new Error("private upstream detail"); });
  const logging = mock.method(console, "error", () => {});
  try {
    await assert.rejects(fetchCandles(), { message: "Unavailable to fetch market data." });
  } finally {
    get.mock.restore();
    logging.mock.restore();
  }
});
