const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");
const {
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_LIMIT,
} = require("../config/MarketConfig");

/**
 * GET /api/candles
 *
 * Fetch market candles and return them in the
 * application's standard cccandle format.
 */

async function getCandles(req, res) {
  try {
    const {
      symbol = DEFAULT_SYMBOL,
      interval = DEFAULT_INTERVAL,
      limit = DEFAULT_LIMIT,
    } = req.query;

    const parsedLimit = Number(limit);
    if (!Number.isInteger(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limit must be a positive integer",
      });
    }

    //Fetch raw market data
    const rawCandles = await BinanceService.fetchCandles(
      symbol,
      interval,
      parsedLimit
    );

    //Convert to standard format
    const cleanedCandles = DataCleaner.cleanCandles(rawCandles);

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      symbol,
      interval,
      total: cleanedCandles.length,
      data: cleanedCandles,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  getCandles,
};
