const axios = require("axios");
const {
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_LIMIT,
} = require("../config/MarketConfig");
const BASE_URL = "https://api.binance.com/api/v3/klines";

/**
 * Fetch a raw Binance candle array. An empty array is a valid empty result.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function fetchCandles(
  symbol = DEFAULT_SYMBOL,
  interval = DEFAULT_INTERVAL,
  limit = DEFAULT_LIMIT
) {
  try {
    const response = await axios.get(BASE_URL, {
      timeout: 8000,
      params: {
        symbol,
        interval,
        limit,
      },
    });
    if (!Array.isArray(response?.data)) {
      throw new Error("Invalid market-data response.");
    }
    return response.data;
  } catch {
    // Provider bodies, request config and exception messages are not public output.
    console.error("Binance API Error: request or response failed.");
    throw new Error("Unavailable to fetch market data.");
  }
}

module.exports = { fetchCandles };
