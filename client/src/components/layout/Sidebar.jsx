import LoadButton from "../market/LoadButton";
import MarketSelector from "../market/MarketSelector";
import LimitSelector from "../market/LimitSelector";
import TimeframeSelector from "../market/TimeframeSelector";

export default function Sidebar({
  symbol,
  interval,
  limit,
  loading,
  setSymbol,
  setInterval,
  setLimit,
  loadMarket,
}) {
  return (
    <aside>
      <MarketSelector symbol={symbol} onChange={setSymbol} />

      <TimeframeSelector interval={interval} onChange={setInterval} />

      <LimitSelector limit={limit} onChange={setLimit} />

      <LoadButton loading={loading} onClick={loadMarket} />
    </aside>
  );
}
