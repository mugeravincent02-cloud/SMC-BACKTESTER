const axios = require("axios");
const {
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_LIMIT,
} = require("../config/MarketConfig");
const { performance } = require('node:perf_hooks');
const { UPSTREAM_URL, requestContext, logFailure } = require('./MarketDiagnostics');

/**
 * Fetch a raw Binance candle array. An empty array is a valid empty result.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @param {{requestId: string, endpoint?: string}} context Internal correlation only.
 * @returns {Promise<Array>}
 */
async function fetchCandles(
  symbol = DEFAULT_SYMBOL,
  interval = DEFAULT_INTERVAL,
  limit = DEFAULT_LIMIT,
  context = requestContext()
) {
  const started = performance.now();
  let response;
  try {
    response = await axios.get(UPSTREAM_URL, {
      timeout: 8000,
      params: {
        symbol,
        interval,
        limit,
      },
    });
    if (!Array.isArray(response?.data)) {
      throw Object.assign(new Error("Invalid market-data response."), { code: 'INVALID_UPSTREAM_RESPONSE' });
    }
    return response.data;
  } catch (error) {
    // Provider bodies, request config and exception messages are not public output.
    logFailure('binance_failure', context, { symbol, interval, limit }, started, error, response);
    throw new Error("Unavailable to fetch market data.");
  }
}

module.exports = { fetchCandles };
