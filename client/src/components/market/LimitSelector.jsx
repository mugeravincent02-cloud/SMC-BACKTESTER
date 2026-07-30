export default function MarketSelector({ limit, onChange }) {
  return (
    <div>
      <label htmlFor="limit">Candles</label>

      <input
        id="limit"
        type="number"
        min="10"
        max="1000"
        step="10"
        value={limit}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
