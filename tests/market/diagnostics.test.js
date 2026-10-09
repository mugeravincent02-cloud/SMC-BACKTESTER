const { it } = require('node:test');
const assert = require('node:assert/strict');
const { performance } = require('node:perf_hooks');
const { createRequire } = require('node:module');
const { sanitizeMessage, requestContext, logFailure } = require('../../server/market/MarketDiagnostics');
const { fetchCandles } = require('../../server/market/BinanceService');
const axios = createRequire(require.resolve('../../server/market/BinanceService'))('axios');

it('diagnostic messages are bounded, one-line and redact credentials, headers, URLs and token-like strings', () => {
  assert.equal(sanitizeMessage('Too many requests.\nPlease wait.'), 'Too many requests. Please wait.');
  assert.equal(sanitizeMessage('x'.repeat(20) + ' '.repeat(2) + 'ordinary text '.repeat(50)).length, 240);
  for (const text of ['Authorization: Bearer credential-sentinel', 'headers: { X-Test: credential-sentinel }', 'Cookie: credential-sentinel', 'password=credential-sentinel', 'secret: credential-sentinel', 'X-MBX-APIKEY credential-sentinel', 'token=credential-sentinel', 'signature=credential-sentinel']) {
    assert.equal(sanitizeMessage(text), '[Sensitive diagnostic message redacted]');
  }
  assert.equal(sanitizeMessage('connect https://user:credential-sentinel@example.com/path?private=hidden'), 'connect [URL redacted]');
  assert.doesNotMatch(sanitizeMessage('failed abcdef0123456789abcdef0123456789abcdef'), /abcdef/);
  assert.equal(sanitizeMessage('<html><body>Upstream unavailable</body></html>'), 'Upstream unavailable');
  assert.equal(sanitizeMessage({ private: 'sentinel' }), 'No upstream error message available.');
});

it('diagnostics record only approved scalar fields and never access error config, headers or stack', t => {
  const log = t.mock.method(console, 'error', () => {});
  const context = requestContext('/api/candles');
  const error = { code: 'ECONNRESET', response: { status: 503, data: { code: -1000, msg: 'temporarily unavailable', secret: 'sentinel' } } };
  for (const key of ['config', 'request', 'headers', 'stack']) Object.defineProperty(error, key, { get() { throw new Error('must not access'); } });
  logFailure('binance_failure', context, { symbol: 'ETHUSDT', interval: '5m', limit: 50 }, performance.now() - 15, error);
  const record = JSON.parse(log.mock.calls[0].arguments[0]);
  assert.equal(record.requestId, context.requestId); assert.equal(record.endpoint, '/api/candles');
  assert.equal(record.upstreamHostname, 'api.binance.com'); assert.equal(record.upstreamPath, '/api/v3/klines');
  assert.equal(record.symbol, 'ETHUSDT'); assert.equal(record.interval, '5m'); assert.equal(record.limit, 50);
  assert.ok(record.elapsedMs >= 15); assert.equal(record.errorCode, 'ECONNRESET'); assert.equal(record.upstreamStatus, 503);
  assert.equal(record.upstreamCode, -1000); assert.equal(record.message, 'temporarily unavailable');
  assert.doesNotMatch(JSON.stringify(record), /sentinel|must not access/);
  assert.equal(log.mock.calls[0].arguments.length, 1);
});

it('transport and timeout diagnostics expose codes server-side with one upstream attempt and unchanged timeout', async t => {
  const get = t.mock.method(axios, 'get');
  const log = t.mock.method(console, 'error', () => {});
  for (const code of ['ENOTFOUND', 'EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ECONNABORTED']) {
    get.mock.mockImplementation(async (_, options) => { assert.equal(options.timeout, 8000); throw Object.assign(new Error('temporary transport failure'), { code }); });
    const before = get.mock.callCount();
    await assert.rejects(fetchCandles('BTCUSDT', '1h', 1000), { message: 'Unavailable to fetch market data.' });
    assert.equal(get.mock.callCount(), before + 1);
    const record = JSON.parse(log.mock.calls.at(-1).arguments[0]);
    assert.equal(record.errorCode, code); assert.equal(record.upstreamStatus, null);
    assert.match(record.requestId, /^[a-f0-9-]{36}$/); assert.equal(record.limit, 1000);
  }
});

it('malformed upstream responses retain HTTP status and internal error code without exposing payloads publicly', async t => {
  t.mock.method(axios, 'get', async () => ({ status: 200, data: { msg: 'unexpected object response', private: 'sentinel' } }));
  const log = t.mock.method(console, 'error', () => {});
  await assert.rejects(fetchCandles(), { message: 'Unavailable to fetch market data.' });
  const record = JSON.parse(log.mock.calls[0].arguments[0]);
  assert.equal(record.upstreamStatus, 200); assert.equal(record.errorCode, 'INVALID_UPSTREAM_RESPONSE');
  assert.equal(record.message, 'unexpected object response'); assert.doesNotMatch(JSON.stringify(record), /sentinel/);
});

it('unusual rejections and throwing diagnostic getters do not replace the public error', async t => {
  const get = t.mock.method(axios, 'get');
  t.mock.method(console, 'error', () => {});
  const hostile = {};
  for (const key of ['response', 'message', 'code']) Object.defineProperty(hostile, key, { get() { throw new Error('private getter'); } });
  for (const error of [null, undefined, 'private string', hostile]) {
    get.mock.mockImplementation(async () => { throw error; });
    await assert.rejects(fetchCandles(), { message: 'Unavailable to fetch market data.' });
  }
});
