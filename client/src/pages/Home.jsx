import { useCallback, useEffect, useRef, useState } from "react";
import CandleChart from "../charts/CandleChart";

import DashboardLayout from "../components/layout/DashboardLayout";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import StatisticalPanel from "../components/market/StatisticsPanel";
import CandleTable from "../components/market/CandleTable";

import { getMarketData } from "../services/MarketService";

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [limit, setLimit] = useState(100);

  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const activeRequest = useRef(null);

  const loadMarket = useCallback(async (selection) => {
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setLoading(true);
    setError("");

    try {
      const data = await getMarketData(
        selection.symbol, selection.interval, selection.limit, controller.signal
      );
      if (!controller.signal.aborted) setMarket(data);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarket({ symbol: "BTCUSDT", interval: "1h", limit: 100 });
    return () => activeRequest.current?.abort();
  }, [loadMarket]);

  return (
    <DashboardLayout>
      <Navbar />
      {loading && <div className="market-status" role="status">Loading Market...</div>}
      {error && <div className="market-status" role="alert">{error} Try loading the market again.</div>}
      <Sidebar
        symbol={symbol}
        interval={interval}
        limit={limit}
        loading={loading}
        setSymbol={setSymbol}
        setInterval={setInterval}
        setLimit={setLimit}
        loadMarket={() => loadMarket({ symbol, interval, limit })}
      />
      <section className="chart" aria-label="Candlestick chart">
        <CandleChart candles={market?.data || []} />
      </section>
      <div className="statistics">
        <StatisticalPanel market={market} />
      </div>
      <div className="table">
        <CandleTable candles={market?.data || []} />
      </div>
    </DashboardLayout>
  );
}
