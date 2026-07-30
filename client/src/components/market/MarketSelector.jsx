export default function MarketSelector({ symbol, onChange }) {
  const symbols = ["BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT"];

  return (
    <div>
      <label htmlFor="symbol">Market</label>

      <select
        name=""
        id="symbol"
        value={symbol}
        onChange={(e) => onChange(e.target.value)}
      >
        {symbols.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}
