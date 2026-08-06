const { detectSwings } = require("../smc/SwingDetector");
const { classifyStructure } = require("../smc/StructureDetector");
const { detectBOS } = require("../smc/BOSDetector");
const { detectCHOCK } = require("../smc/CHOCHDetector");

const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");

async function detectMarketStructure(req, res) {
  try {
    const raw = await BinanceService.fetchCandles("BTCUSDT", "1h", 100);

    const candles = DataCleaner.cleanCandles(raw);

    const structure = classifyStructure(swings);
    const bos = detectBOS(candles, swings);
    const swings = detectSwings(candles);
    const choch = detectCHOCK(structure);

    res.json({
      success: true,
      swings,
      structure,
      bos,
      choch,
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
