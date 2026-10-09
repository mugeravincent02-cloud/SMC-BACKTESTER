const { it } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { createRequire } = require('node:module');
const axios = createRequire(require.resolve('../../server/market/BinanceService'))('axios');
const DataCleaner = require('../../server/market/DataCleaner');
const app = require('../../server/app');
const errorBody = { success: false, message: 'Unavailable to fetch market data.' };
const rows = [[1767225600000, '10', '12', '8', '11', '20']];
async function serverFixture(t) {
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  return `http://127.0.0.1:${server.address().port}`;
}
it('both routes correlate upstream and endpoint failures, keep details private, and recover without retries', async t => {
  const base = await serverFixture(t), get = t.mock.method(axios, 'get'), log = t.mock.method(console, 'error', () => {});
  const ids = new Set();
  for (const endpoint of ['/api/candles', '/api/smc/swings']) {
    for (const status of [400, 418, 429, 451, 500, 503]) {
      get.mock.mockImplementation(async () => { throw Object.assign(new Error('Request failed'), { code: 'ERR_BAD_RESPONSE', response: { status, data: { code: -1003, msg: 'temporary upstream failure' }, headers: { authorization: 'credential-sentinel' } }, config: { headers: { cookie: 'credential-sentinel' } } }); });
      const attempts = get.mock.callCount(), logs = log.mock.callCount();
      const response = await fetch(`${base}${endpoint}?symbol=ETHUSDT&interval=5m&limit=50`);
      assert.equal(response.status, 500); assert.deepEqual(await response.json(), errorBody);
      assert.equal(get.mock.callCount(), attempts + 1);
      const records = log.mock.calls.slice(logs).map(call => JSON.parse(call.arguments[0]));
      assert.equal(records.length, 2); assert.equal(records[0].event, 'binance_failure');
      assert.equal(records[1].event, 'market_request_failure:upstream');
      assert.equal(records[0].requestId, records[1].requestId); assert.equal(records[0].upstreamStatus, status);
      assert.equal(records[0].endpoint, endpoint); assert.equal(records[0].symbol, 'ETHUSDT');
      assert.equal(records[0].interval, '5m'); assert.equal(records[0].limit, 50);
      assert.doesNotMatch(JSON.stringify(records), /credential-sentinel|authorization|cookie/);
      assert.ok(!ids.has(records[0].requestId)); ids.add(records[0].requestId);
    }
    get.mock.mockImplementation(async () => ({ status: 200, data: rows }));
    const response = await fetch(`${base}${endpoint}`); assert.equal(response.status, 200); assert.equal((await response.json()).total, 1);
  }
});

it('cleaning failures are distinguished from upstream failures and SMC no longer leaks dependency messages', async t => {
  const base = await serverFixture(t);
  t.mock.method(axios, 'get', async () => ({ status: 200, data: rows }));
  t.mock.method(DataCleaner, 'cleanCandles', () => { throw new Error('private cleaner detail sentinel'); });
  const log = t.mock.method(console, 'error', () => {});
  for (const endpoint of ['/api/candles', '/api/smc/swings']) {
    const response = await fetch(`${base}${endpoint}`);
    assert.equal(response.status, 500); assert.deepEqual(await response.json(), errorBody);
    const record = JSON.parse(log.mock.calls.at(-1).arguments[0]);
    assert.equal(record.endpoint, endpoint); assert.equal(record.event, 'market_request_failure:cleaning');
    assert.equal(record.upstreamStatus, null); assert.equal(record.message, 'private cleaner detail sentinel');
  }
});
