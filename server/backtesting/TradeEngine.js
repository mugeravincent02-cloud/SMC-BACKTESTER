function executeTrade({
  direction,
  entry,
  stop,
  takeProfit,
  quantity = 1,
  exitPrice,
}) {
  const numericQuantity = Number(quantity);
  const safeQuantity =
    Number.isFinite(numericQuantity) && numericQuantity > 0
      ? numericQuantity
      : 1;
  const numericEntry = Number(entry);
  const numericExit = Number(exitPrice);

  if (!Number.isFinite(numericEntry) || !Number.isFinite(numericExit)) {
    return {
      valid: false,
      direction,
      entry,
      stop,
      takeProfit,
      quantity: safeQuantity,
      exitPrice,
      pnl: 0,
      result: "INVALID",
    };
  }

  const delta =
    direction === "SHORT"
      ? numericEntry - numericExit
      : numericExit - numericEntry;

  const pnl = delta * safeQuantity;

  let result = "BREAKEVEN";
  if (pnl > 0) {
    result = "WIN";
  } else if (pnl < 0) {
    result = "LOSS";
  }

  return {
    valid: true,
    direction,
    entry: numericEntry,
    stop,
    takeProfit,
    quantity: safeQuantity,
    exitPrice: numericExit,
    pnl,
    result,
  };
}

module.exports = {
  executeTrade,
};
