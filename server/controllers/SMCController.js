const { detectSwings } = require("../smc/SwingDetector");
const { classifyStructure } = require("../smc/StructureDetector");
const { detectBOS } = require("../smc/BOSDetector");
const { detectCHOCH } = require("../smc/CHOCHDetector");
const { detectLiquidity } = require("../smc/LiquidityDetector");

const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");

async function detectMarketStructure(req, res) {
  try {
    const { symbol, interval, limit } = req.marketQuery;
    const raw = await BinanceService.fetchCandles(symbol, interval, limit);

    const candles = DataCleaner.cleanCandles(raw);

    const swings = detectSwings(candles);

    const structure = classifyStructure(swings);
    const bos = detectBOS(candles, swings, structure);
    const choch = detectCHOCH(candles, structure);
    const liquidity = detectLiquidity(swings, candles);

    res.json({
      success: true,
      swings,
      structure,
      bos,
      choch,
      liquidity,
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
