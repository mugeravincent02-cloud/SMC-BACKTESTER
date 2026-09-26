import { useCallback, useEffect, useRef, useState } from "react";
import CandleChart from "../charts/CandleChart";

import DashboardLayout from "../components/layout/DashboardLayout";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import StatisticalPanel from "../components/market/StatisticsPanel";
import CandleTable from "../components/market/CandleTable";

import { getMarketData } from "../services/MarketService";
import { getSmcData } from "../services/SMCService";

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [limit, setLimit] = useState(100);

  const [market, setMarket] = useState(null);
  const [smcData, setSmcData] = useState(null);
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
      const [marketData, structureData] = await Promise.all([
        getMarketData(
          selection.symbol,
          selection.interval,
          selection.limit,
          controller.signal,
        ),
        getSmcData(
          selection.symbol,
          selection.interval,
          selection.limit,
          controller.signal,
        ),
      ]);

      if (controller.signal.aborted) return;

      const marketCandles = Array.isArray(marketData?.data)
        ? marketData.data
        : [];
      const smcCandles = Array.isArray(structureData?.data)
        ? structureData.data
        : [];
      if (
        marketCandles.length > 0 &&
        smcCandles.length > 0 &&
        (marketCandles.length !== smcCandles.length ||
          marketCandles.some((candle, index) => candle.time !== smcCandles[index]?.time))
      ) {
        throw new Error(
          "Market and SMC candle data mismatch. Overlay data was not rendered.",
        );
      }

      setMarket(marketData);
      setSmcData(structureData);
    } catch (err) {
      if (!controller.signal.aborted) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Unable to load market or SMC data.",
        );
        setMarket(null);
        setSmcData(null);
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
      {loading && (
        <div className="market-status" role="status">
          Loading Market...
        </div>
      )}
      {error && (
        <div className="market-status" role="alert">
          {error} Try loading the market again.
        </div>
      )}
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
        <CandleChart
          candles={market?.data || []}
          overlays={
            smcData?.overlays || {
              fvg: [],
              bos: [],
              choch: [],
              liquidity: [],
              orderBlocks: [],
              pois: [],
            }
          }
        />
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
