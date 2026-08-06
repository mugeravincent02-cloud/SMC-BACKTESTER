const { detectSwings } = require("../smc/SwingDetector");
const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");

async function detectMarketStructure(req, res) {
  try {
    const raw = await BinanceService.fetchCandles("BTCUSDT", "1h", 100);

    const candles = DataCleaner.cleanCandles(raw);

    const swings = detectSwings(candles);

    res.json({
      success: true,
      total: swings.length,
      data: swings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  detectMarketStructure,
};
