function calculateRisk({ accountBalance, riskPercent, stopDistance }) {
  const hasValidBalance = Number.isFinite(accountBalance) && accountBalance > 0;
  const hasValidRisk = Number.isFinite(riskPercent) && riskPercent > 0;
  const hasValidStop = Number.isFinite(stopDistance) && stopDistance > 0;

  if (!hasValidBalance || !hasValidRisk || !hasValidStop) {
    return {
      valid: false,
      accountBalance,
      riskPercent,
      stopDistance,
      riskAmount: 0,
      positionSize: 0,
    };
  }

  const riskAmount = accountBalance * (riskPercent / 100);
  const positionSize = riskAmount / stopDistance;

  return {
    valid: true,
    accountBalance,
    riskPercent,
    stopDistance,
    riskAmount,
    positionSize,
  };
}

module.exports = {
  calculateRisk,
};
