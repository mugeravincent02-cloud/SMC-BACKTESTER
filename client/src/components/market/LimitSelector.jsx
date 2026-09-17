export default function LimitSelector({ limit, onChange }) {
  return (
    <div>
      <label htmlFor="limit">Candles</label>

      <input
        id="limit"
        type="number"
        min="1"
        max="1000"
        step="1"
        value={limit}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
