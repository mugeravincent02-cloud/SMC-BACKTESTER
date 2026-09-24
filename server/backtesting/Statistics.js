function summarizeTrades(trades = []) {
  const list = Array.isArray(trades) ? trades : [];
  const totalTrades = list.length;
  const wins = list.filter((trade) => Number(trade?.pnl ?? 0) > 0).length;
  const losses = list.filter((trade) => Number(trade?.pnl ?? 0) < 0).length;
  const netPnl = list.reduce((sum, trade) => sum + Number(trade?.pnl ?? 0), 0);
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

  return {
    totalTrades,
    wins,
    losses,
    winRate: Number(winRate.toFixed(2)),
    netPnl,
  };
}

module.exports = {
  summarizeTrades,
};
