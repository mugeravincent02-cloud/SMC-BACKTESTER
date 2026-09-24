const { summarizeTrades } = require("./Statistics");

function analyzePerformance(trades = []) {
  const list = Array.isArray(trades) ? trades : [];
  const summary = summarizeTrades(list);
  const winners = list.filter((trade) => Number(trade?.pnl ?? 0) > 0).length;
  const losers = list.filter((trade) => Number(trade?.pnl ?? 0) < 0).length;

  return {
    summary,
    winners,
    losers,
    trades: list,
  };
}

module.exports = {
  analyzePerformance,
};
