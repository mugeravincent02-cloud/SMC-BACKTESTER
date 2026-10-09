const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");
const { performance } = require('node:perf_hooks');
const { requestContext, logFailure } = require('../market/MarketDiagnostics');

/**
 * GET /api/candles
 *
 * Fetch market candles and return them in the
 * application's standard candle format.
 */

async function getCandles(req, res) {
  const context = requestContext('/api/candles');
  const started = performance.now();
  let stage = 'upstream';
  try {
    const { symbol, interval, limit } = req.marketQuery;

    //Fetch raw market data
    const rawCandles = await BinanceService.fetchCandles(
      symbol,
      interval,
      limit,
      context
    );

    //Convert to standard format
    stage = 'cleaning';
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
    logFailure(`market_request_failure:${stage}`, context, req.marketQuery || {}, started, error);

    res.status(500).json({
      success: false,
      message: "Unavailable to fetch market data.",
    });
  }
}

module.exports = {
  getCandles,
};
