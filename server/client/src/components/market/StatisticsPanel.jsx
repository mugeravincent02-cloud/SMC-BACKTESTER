import Card from "../common/Card";

export default function StatisticalPanel({ market }) {
  if (!market || !market.data.length) {
    return <section>No market data available</section>;
  }
  const candles = market.data;
  const latest = candles[candles.length - 1];

  const highestHigh = Math.max(...candles.map((candle) => candle.high));

  const lowerLow = Math.min(...candles.map((candle) => candle.low));

  return (
    <Card title="Market Statistics">
      <p>
        <strong>Market: </strong> {market.symbol}
      </p>
      <p>
        <strong>Timeframe: </strong> {market.interval}
      </p>
      <p>
        <strong>Candles Loaded: </strong> {market.total}
      </p>
      <p>
        <strong>Latest Close: </strong> {latest.close}
      </p>
      <p>
        <strong>Highest High: </strong> {highestHigh}
      </p>
      <p>
        <strong>Lowest Low: </strong> {lowerLow}
      </p>
      <p>
        <strong>Latest Volume: </strong> {latest.volume}
      </p>
    </Card>
  );
}
