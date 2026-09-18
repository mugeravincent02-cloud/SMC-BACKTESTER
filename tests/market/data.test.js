const { it, mock } = require("node:test");
const assert = require("node:assert/strict");
const { createServer } = require("node:http");
const { once } = require("node:events");
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
    assert.equal(options.timeout, 8000);
  } finally {
    get.mock.restore();
  }
});

it("converts numeric timestamps and decimal fields, ignoring unused provider columns", () => {
  assert.deepEqual(cleanCandles([
    [String(row[0]), "10.25", "12.5", "8.125", "11.75", "0", "unused close time"],
  ]), [{ time: row[0], open: 10.25, high: 12.5, low: 8.125, close: 11.75, volume: 0 }]);
  assert.deepEqual(cleanCandles([[row[0], 10, 12, 8, 11, 20]]), cleanCandles([row]));
});

it("rejects missing or invalid values in each required OHLCV field", () => {
  for (let field = 1; field <= 5; field++) {
    for (const value of [undefined, null, false, {}, [], "", " ", "bad", NaN, Infinity, -Infinity, -1]) {
      const invalid = row.slice();
      invalid[field] = value;
      assert.throws(() => cleanCandles([invalid]), /Invalid candle/, `field ${field}`);
    }
  }
  for (let field = 1; field <= 4; field++) {
    const invalid = row.slice();
    invalid[field] = 0;
    assert.throws(() => cleanCandles([invalid]), /Invalid candle/);
  }
  for (let field = 0; field <= 5; field++) {
    const missing = row.slice();
    delete missing[field];
    assert.throws(() => cleanCandles([missing]), /Invalid candle/);
  }
});

it("rejects invalid timestamps without silently coercing booleans or blanks", () => {
  for (const time of [undefined, null, false, "", " ", NaN, Infinity, -1, 0.5, 8.7e15]) {
    assert.throws(() => cleanCandles([[time, ...row.slice(1)]]), /Invalid candle/);
  }
});

it("rejects sparse candle arrays instead of allowing null JSON entries", () => {
  const missingOnlyRow = [row];
  delete missingOnlyRow[0];
  const missingMiddleRow = [row, row, [row[0] + 1000, ...row.slice(1)]];
  delete missingMiddleRow[1];
  for (const input of [missingOnlyRow, missingMiddleRow]) {
    assert.throws(() => cleanCandles(input), /Invalid candle/);
  }
});

it("uses the existing shared market defaults for direct provider calls", async (t) => {
  const get = t.mock.method(axios, "get", async () => ({ data: [] }));
  assert.deepEqual(await fetchCandles(), []);
  assert.deepEqual(get.mock.calls[0].arguments, [
    "https://api.binance.com/api/v3/klines",
    { timeout: 8000, params: { symbol: "BTCUSDT", interval: "1h", limit: 100 } },
  ]);
});

it("keeps a genuine empty provider array as a valid empty result", async (t) => {
  const data = [];
  t.mock.method(axios, "get", async () => ({ data }));
  assert.equal(await fetchCandles(), data);
});

it("rejects malformed provider envelopes with the generic public error", async (t) => {
  const get = t.mock.method(axios, "get");
  t.mock.method(console, "error", () => {});
  for (const response of [undefined, null, {}, { data: null }, { data: "" }, { data: "[]" }, { data: { code: -1121, msg: "private provider detail" } }]) {
    get.mock.mockImplementation(async () => response);
    await assert.rejects(fetchCandles(), { message: "Unavailable to fetch market data." });
  }
});

it("sanitizes non-Error provider rejections as well as ordinary errors", async (t) => {
  const get = t.mock.method(axios, "get");
  t.mock.method(console, "error", () => {});
  for (const reason of [null, undefined, "private provider detail", { message: "private provider detail" }]) {
    get.mock.mockImplementation(async () => { throw reason; });
    await assert.rejects(fetchCandles(), { message: "Unavailable to fetch market data." });
  }
});

it("enforces the unchanged eight-second Axios timeout against a stalled local server", { timeout: 20000 }, async (t) => {
  let requests = 0;
  const server = createServer(() => { requests++; });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const realGet = axios.get.bind(axios);
  let transportCode;
  t.mock.method(console, "error", () => {});
  t.mock.method(axios, "get", async (url, options) => {
    assert.equal(url, "https://api.binance.com/api/v3/klines");
    assert.equal(options.timeout, 8000);
    try {
      // Only the test substitutes the destination; production config remains fixed.
      return await realGet(`http://127.0.0.1:${server.address().port}/klines`, { ...options, proxy: false });
    } catch (error) {
      transportCode = error.code;
      throw error;
    }
  });
  try {
    await assert.rejects(fetchCandles(), { message: "Unavailable to fetch market data." });
    assert.equal(requests, 1);
    assert.ok(["ECONNABORTED", "ETIMEDOUT"].includes(transportCode));
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
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
