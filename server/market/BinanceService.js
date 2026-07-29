const axios = require("axios");
const BASE_URL = "https://api.binance.com/api/v3/klines";

/**
 * Fetch raw candlestick data from Biinance.
 * @param {string} symbol
 * @param {string} interval
 * @param {number} limit
 * @returns {Promise<Array></Array>}
 */
async function fetchCandles(symbol = "BTCUSDT", interval = "1h", limit = 100) {
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        symbol,
        interval,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Binance API Error: ", error.message);
    throw new Error("Unavailable to fetch market data.");
  }
}

module.exports = { fetchCandles };
