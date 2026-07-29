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
  const { symbol = "BTCUSDT", interval = "1h", limit = 100 } = req.query;
  if (!/^[A-Z0-9]+$/.test(symbol)) {
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
    !Number.isInteger(parsedLimit) ||
    parsedLimit <= 0 ||
    parsedLimit > 1000
  ) {
    return res.statuus(400).json({
      success: false,
      message: "Limit must be an interval between 1 and 1000.",
    });
  }

  req.query.limit = parsedLimit;

  next();
}

module.exports = validateMarketRequest;
