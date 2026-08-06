/**
 * Converts one Binance candle into the application's
 * standard candle format
 *
 * @param {Array} candle
 * @returns {object}
 */

function cleanCandle(candle) {
  return {
    time: candle[0],
    open: Number(candle[1]),
    high: Number(candle[2]),
    low: Number(candle[3]),
    close: Number(candle[4]),
    volume: Number(candle[5]),
  };
}

/**
 * Converts an array of Binance candles into
 * the application's standard format.
 *
 * @param {Array} candles
 * @returns {Array}
 */

function cleanCandles(candles) {
  if (!Array.isArray(candles)) {
    throw new Error(
      `Expected an array of candles but received ${typeof candles}`
    );
  }
  return candles.map(cleanCandle);
}

module.exports = {
  cleanCandle,
  cleanCandles,
};
