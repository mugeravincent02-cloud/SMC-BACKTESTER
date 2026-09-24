const express = require("express");
const cors = require("cors");

const marketRoutes = require("./routes/MarketRoutes");
const smcRoutes = require("./routes/smcRoutes");
const { runBacktest } = require("./backtesting/BacktestRunner");

const app = express();

app.use((req, res, next) => {
  res.setHeader("x-frame-options", "DENY");
  res.setHeader("x-content-type-options", "nosniff");
  res.setHeader("x-xss-protection", "1; mode=block");
  next();
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ strict: true }));

app.use("/api/smc", smcRoutes);
app.use("/api", marketRoutes);

app.post("/api/backtest", (req, res) => {
  try {
    const config = req.body || {};
    const symbol =
      typeof config.symbol === "string" ? config.symbol : "BTCUSDT";
    const timeframe =
      typeof config.timeframe === "string" ? config.timeframe : "1h";
    const range = Number.isFinite(Number(config.range))
      ? Number(config.range)
      : 20;
    const initialBalance = Number.isFinite(Number(config.initialBalance))
      ? Number(config.initialBalance)
      : 1000;
    const riskPercent = Number.isFinite(Number(config.riskPercent))
      ? Number(config.riskPercent)
      : 1;

    const backtest = runBacktest({
      trades: Array.isArray(config.trades)
        ? config.trades
        : [
            {
              direction: "LONG",
              entry: 100,
              stop: 98,
              takeProfit: 108,
              exitPrice: 109,
              quantity: 2,
            },
          ],
      accountBalance: initialBalance,
      riskPercent,
    });

    res.status(200).json({
      success: true,
      backtest: {
        symbol,
        timeframe,
        range,
        initialBalance,
        riskPercent,
      },
      trades: backtest.tradeResults,
      summary: backtest.summary,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Invalid backtest configuration.",
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    status: "Server running",
  });
});

module.exports = app;
