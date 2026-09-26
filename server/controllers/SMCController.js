const { detectSwings } = require("../smc/SwingDetector");
const { classifyStructure } = require("../smc/StructureDetector");
const { detectBOS } = require("../smc/BOSDetector");
const { detectCHOCH } = require("../smc/CHOCHDetector");
const { detectLiquidity } = require("../smc/LiquidityDetector");
const { detectFairValueGaps } = require("../smc/FairValueGapDetector");
const { detectOrderBlocks } = require("../smc/OrderBlockDetector");
const { detectPOIs } = require("../smc/POIDetector");
const { normalizeSmcOverlays } = require("../smc/ChartOverlayBuilder");

const BinanceService = require("../market/BinanceService");
const DataCleaner = require("../market/DataCleaner");

function includePoiCandidates(fvg, bos, choch, orderBlocks, liquidity) {
  const candidates = [];

  if (Array.isArray(fvg)) {
    for (const item of fvg) {
      const low = Number(item.startPrice ?? item.low);
      const high = Number(item.endPrice ?? item.high);
      if (Number.isFinite(low) && Number.isFinite(high) && low < high) {
        candidates.push({
          direction: item.direction === "BEARISH" ? "BEARISH" : "BULLISH",
          type: "FVG",
          low,
          high,
          index: item.startIndex ?? item.endIndex ?? 0,
        });
      }
    }
  }

  for (const item of Array.isArray(bos) ? bos : []) {
    const level = Number(
      item.level ??
        item.breakPrice ??
        item.brokenSwingCandle?.high ??
        item.brokenSwingCandle?.low,
    );
    if (Number.isFinite(level)) {
      candidates.push({
        direction: item.direction === "BEARISH" ? "BEARISH" : "BULLISH",
        type: "STRUCTURE",
        level,
        index: item.breakIndex ?? item.brokenSwing ?? 0,
      });
    }
  }

  for (const item of Array.isArray(choch) ? choch : []) {
    const level = Number(
      item.level ?? item.breakPrice ?? item.candle?.close ?? 0,
    );
    if (Number.isFinite(level)) {
      candidates.push({
        direction: item.direction === "BEARISH" ? "BEARISH" : "BULLISH",
        type: "STRUCTURE",
        level,
        index: item.breakIndex ?? 0,
      });
    }
  }

  for (const item of Array.isArray(orderBlocks) ? orderBlocks : []) {
    const low = Number(item.zoneLow ?? item.low);
    const high = Number(item.zoneHigh ?? item.high);
    if (Number.isFinite(low) && Number.isFinite(high) && low < high) {
      candidates.push({
        direction: item.direction === "BEARISH" ? "BEARISH" : "BULLISH",
        type: "STRUCTURE",
        low,
        high,
        index: item.index ?? 0,
      });
    }
  }

  for (const row of Array.isArray(liquidity?.previousDayLiquidity)
    ? liquidity.previousDayLiquidity
    : []) {
    const value = Number(row?.pdh ?? row?.pdl);
    if (Number.isFinite(value)) {
      candidates.push({
        direction: "NEUTRAL",
        type: "LIQUIDITY",
        level: value,
        index: 0,
      });
    }
  }

  for (const row of Array.isArray(liquidity?.previousWeekLiquidity)
    ? liquidity.previousWeekLiquidity
    : []) {
    const value = Number(row?.pwh ?? row?.pwl);
    if (Number.isFinite(value)) {
      candidates.push({
        direction: "NEUTRAL",
        type: "LIQUIDITY",
        level: value,
        index: 0,
      });
    }
  }

  for (const row of Array.isArray(liquidity?.sessionLiquidity)
    ? liquidity.sessionLiquidity
    : []) {
    const value = Number(row?.sessionHigh ?? row?.sessionLow);
    if (Number.isFinite(value)) {
      candidates.push({
        direction: "NEUTRAL",
        type: "LIQUIDITY",
        level: value,
        index: 0,
      });
    }
  }

  return candidates;
}

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
    const fvg = detectFairValueGaps(candles);
    const orderBlocks = detectOrderBlocks(candles);
    const poiCandidates = includePoiCandidates(
      fvg,
      bos,
      choch,
      orderBlocks,
      liquidity,
    );
    const pois = detectPOIs(poiCandidates);

    const payload = {
      success: true,
      timestamp: new Date().toISOString(),
      symbol,
      interval,
      total: candles.length,
      data: candles,
      swings,
      structure,
      bos,
      choch,
      liquidity,
      fvg,
      orderBlocks,
      pois,
    };

    payload.overlays = normalizeSmcOverlays(payload, candles);

    res.json(payload);
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
