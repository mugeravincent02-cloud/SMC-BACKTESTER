export default function TimeframeSelector({ interval, onChange }) {
  const intervals = [
    "1m",
    "3m",
    "5m",
    "15m",
    "30m",
    "1h",
    "2h",
    "4h",
    "1d",
    "1w",
    "1M",
  ];
  return (
    <div>
      <label htmlFor="interval">Timeframe</label>
      <select id="interval" value={interval} onChange={(e) => onChange(e.target.value)}>
        {intervals.map((item) => (
          <option key={item} value={item}></option>
        ))}
      </select>
    </div>
  );
}
