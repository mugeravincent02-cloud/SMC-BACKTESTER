const { executeTrade } = require("./TradeEngine");

function runBacktest({
  trades = [],
  accountBalance = 0,
  riskPercent = 0,
} = {}) {
  const list = Array.isArray(trades) ? trades : [];

  const tradeResults = list.map((trade) => {
    const quantity = Number.isFinite(Number(trade.quantity))
      ? Number(trade.quantity)
      : Math.max(
          1,
          (Number(accountBalance) * Number(riskPercent || 0)) /
            100 /
            Math.max(1, Math.abs(Number(trade.entry) - Number(trade.stop))),
        );

    return executeTrade({
      ...trade,
      quantity,
    });
  });

  const summary = {
    totalTrades: tradeResults.length,
    netPnl: tradeResults.reduce(
      (sum, trade) => sum + Number(trade.pnl ?? 0),
      0,
    ),
  };

  return {
    summary,
    tradeResults,
  };
}

module.exports = {
  runBacktest,
};
