import { useEffect, useState } from "react";
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

  async function loadMarket() {
    setLoading(true);
    setError("");

    try {
      const data = await getMarketData(symbol, interval, limit);
      setMarket(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadMarket();
  }, []);

  // if (loading) {
  //   return <h2>Loading market ...</h2>;
  // }
  if (error) {
    return <h2>{error}</h2>;
  }

  return (
    <DashboardLayout>
      {loading && <div className="loading-overlay">Loading Market...</div>}
      <Navbar />
      <Sidebar
        symbol={symbol}
        interval={interval}
        limit={limit}
        loading={loading}
        setSymbol={setSymbol}
        setInterval={setInterval}
        setLimit={setLimit}
        loadMarket={loadMarket}
      />
      <CandleChart candles={market?.data || []} />
      <StatisticalPanel market={market} />
      <CandleTable candles={market?.data || []} />
    </DashboardLayout>
  );
}
