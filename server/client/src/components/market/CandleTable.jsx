import { formatPrice } from "../../utils/formatPrice";
import { formatVolume } from "../../utils/formatVolume";

export default function CandleTable({ candles }) {
  if (!candles.length) {
    return <section>Candle Table</section>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Open</th>
          <th>High</th>
          <th>Low</th>
          <th>Close</th>
          <th>Volume</th>
        </tr>
      </thead>

      <tbody>
        {candles.map((candle) => (
          <tr key={candle.time}>
            <td>{new Date(candle.time).toLocaleString()}</td>

            <td>{candle.open}</td>
            <td>{candle.high}</td>
            <td>{candle.low}</td>
            <td>{formatPrice(candle.close)}</td>
            <td>{formatVolume(candle.volume)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
