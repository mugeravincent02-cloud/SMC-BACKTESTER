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

    //Fetch raw market data
    const rawCandles = await BinanceService.fetchCandles(
      symbol,
      interval,
      limit
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
