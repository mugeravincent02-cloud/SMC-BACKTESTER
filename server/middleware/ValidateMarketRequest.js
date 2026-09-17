const {
  DEFAULT_SYMBOL,
  DEFAULT_INTERVAL,
  DEFAULT_LIMIT,
} = require("../config/MarketConfig");

const validIntervals = [
  "1m",
  "3m",
  "5m",
  "15m",
  "30m",
  "1h",
  "2h",
  "4h",
  "6h",
  "8h",
  "12h",
  "1d",
  "3d",
  "1w",
  "1M",
];

function validateMarketRequest(req, res, next) {
  const {
    symbol = DEFAULT_SYMBOL,
    interval = DEFAULT_INTERVAL,
    limit = DEFAULT_LIMIT,
  } = req.query;
  if (typeof symbol !== "string" || !/^[A-Z0-9]+$/.test(symbol)) {
    return res.status(400).json({
      success: false,
      message: "Invalid symbol format",
    });
  }

  if (!validIntervals.includes(interval)) {
    return res.status(400).json({
      success: false,
      message: "Invalid interval",
    });
  }

  const parsedLimit = Number(limit);

  if (
    !["string", "number"].includes(typeof limit) ||
    !Number.isInteger(parsedLimit) ||
    parsedLimit <= 0 ||
    parsedLimit > 1000
  ) {
    return res.status(400).json({
      success: false,
      message: "Limit must be an integer between 1 and 1000.",
    });
  }

  // Express 5 exposes req.query through a getter; store normalized input separately.
  req.marketQuery = { symbol, interval, limit: parsedLimit };

  next();
}

module.exports = validateMarketRequest;
