const { test } = require("node:test");
const assert = require("node:assert/strict");

const { buildChartOverlays } = require("../../server/smc/ChartOverlayBuilder");
const { calculateRisk } = require("../../server/backtesting/RiskManager");
const { executeTrade } = require("../../server/backtesting/TradeEngine");
const { summarizeTrades } = require("../../server/backtesting/Statistics");
const {
  analyzePerformance,
} = require("../../server/backtesting/PerformanceAnalyzer");
const { runBacktest } = require("../../server/backtesting/BacktestRunner");

test("builds chart overlays for key SMC zones", () => {
  const overlays = buildChartOverlays([
    { direction: "BULLISH", type: "FVG", low: 99.8, high: 100.7, index: 4 },
    { direction: "BEARISH", type: "LIQUIDITY", level: 101.2, index: 8 },
  ]);

  assert.equal(overlays.length, 2);
  assert.equal(overlays[0].direction, "BULLISH");
  assert.equal(overlays[0].type, "box");
  assert.equal(overlays[1].direction, "BEARISH");
  assert.equal(overlays[1].type, "line");
});

test("calculates risk and position size from account balance and stop distance", () => {
  const risk = calculateRisk({
    accountBalance: 10000,
    riskPercent: 1,
    stopDistance: 2,
  });

  assert.equal(risk.valid, true);
  assert.equal(risk.riskAmount, 100);
  assert.equal(risk.positionSize, 50);
});

test("executes a trade and reports the realized PnL outcome", () => {
  const trade = executeTrade({
    direction: "LONG",
    entry: 100,
    stop: 98,
    takeProfit: 106,
    quantity: 2,
    exitPrice: 108,
  });

  assert.equal(trade.result, "WIN");
  assert.equal(trade.pnl, 16);
});

test("summarizes trade performance into win-rate and net PnL metrics", () => {
  const summary = summarizeTrades([
    { pnl: 50 },
    { pnl: -20 },
    { pnl: 30 },
    { pnl: -10 },
  ]);

  assert.equal(summary.totalTrades, 4);
  assert.equal(summary.wins, 2);
  assert.equal(summary.losses, 2);
  assert.equal(summary.winRate, 50);
  assert.equal(summary.netPnl, 50);
});

test("analyzes a completed backtest and produces performance metrics", () => {
  const report = analyzePerformance([
    { pnl: 80, direction: "LONG" },
    { pnl: -30, direction: "SHORT" },
    { pnl: 40, direction: "LONG" },
  ]);

  assert.equal(report.summary.totalTrades, 3);
  assert.equal(report.summary.netPnl, 90);
  assert.equal(report.winners, 2);
  assert.equal(report.losers, 1);
});

test("runs a simple chronological backtest using risk and exit logic", () => {
  const report = runBacktest({
    trades: [
      {
        direction: "LONG",
        entry: 100,
        stop: 98,
        takeProfit: 108,
        exitPrice: 109,
        quantity: 2,
      },
      {
        direction: "SHORT",
        entry: 105,
        stop: 107,
        takeProfit: 99,
        exitPrice: 101,
        quantity: 3,
      },
    ],
    accountBalance: 1000,
    riskPercent: 2,
  });

  assert.equal(report.summary.totalTrades, 2);
  assert.equal(report.tradeResults[0].pnl, 18);
  assert.equal(report.tradeResults[1].pnl, 12);
});
