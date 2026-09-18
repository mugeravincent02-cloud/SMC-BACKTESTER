/**
 * Converts one Binance candle into the application's
 * standard candle format
 *
 * @param {Array} candle
 * @returns {object}
 */

function cleanCandle(candle) {
  if (
    !Array.isArray(candle) ||
    candle.length < 6 ||
    candle.slice(0, 6).some((value) =>
      !["string", "number"].includes(typeof value) || String(value).trim() === ""
    )
  ) {
    throw new Error("Invalid candle: expected timestamp and OHLCV values.");
  }

  const cleaned = {
    time: Number(candle[0]),
    open: Number(candle[1]),
    high: Number(candle[2]),
    low: Number(candle[3]),
    close: Number(candle[4]),
    volume: Number(candle[5]),
  };

  if (
    !Object.values(cleaned).every(Number.isFinite) ||
    !Number.isSafeInteger(cleaned.time) ||
    cleaned.time < 0 ||
    Number.isNaN(new Date(cleaned.time).getTime()) ||
    cleaned.low <= 0 ||
    cleaned.high < Math.max(cleaned.open, cleaned.close, cleaned.low) ||
    cleaned.low > Math.min(cleaned.open, cleaned.close) ||
    cleaned.volume < 0
  ) {
    throw new Error("Invalid candle: expected a valid timestamp and consistent numeric OHLCV values.");
  }

  return cleaned;
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
  // Array.from visits missing entries too; map would preserve holes as null in JSON.
  const cleaned = Array.from(candles, cleanCandle);
  for (let i = 1; i < cleaned.length; i++) {
    if (cleaned[i].time <= cleaned[i - 1].time) {
      throw new Error("Invalid candles: timestamps must be unique and increasing.");
    }
  }
  return cleaned;
}

module.exports = {
  cleanCandle,
  cleanCandles,
};
