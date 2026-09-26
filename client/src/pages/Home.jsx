import { useCallback, useEffect, useRef, useState } from "react";
import CandleChart from "../charts/CandleChart";

import DashboardLayout from "../components/layout/DashboardLayout";
import Navbar from "../components/layout/Navbar";
import Sidebar from "../components/layout/Sidebar";

import StatisticalPanel from "../components/market/StatisticsPanel";
import CandleTable from "../components/market/CandleTable";

import { getMarketData } from "../services/MarketService";
import { getSmcData } from "../services/SMCService";

const overlayDefaults = {
  fvg: true,
  bos: true,
  choch: true,
  liquidity: true,
  orderBlocks: true,
  pois: true,
};

function formatOverlayLabel(key) {
  return key.replace(/([A-Z])/g, " $1").toUpperCase();
}

function formatStamp(time) {
  return time ? new Date(time * 1000).toLocaleString() : "—";
}

function OverlayControls({ visible, setVisible }) {
  return (
    <fieldset className="overlay-controls" aria-label="SMC overlays">
      {Object.keys(overlayDefaults).map((key) => (
        <label key={key}>
          <input
            type="checkbox"
            checked={visible[key]}
            onChange={() =>
              setVisible((old) => ({ ...old, [key]: !old[key] }))
            }
          />
          {formatOverlayLabel(key)}
        </label>
      ))}
    </fieldset>
  );
}

function OverlayVerification({ selected }) {
  if (!selected) {
    return <p>Select an SMC line, zone, or marker on the chart to inspect it.</p>;
  }

  const level =
    selected.level ?? `${selected.low ?? "—"}-${selected.high ?? "—"}`;
  const status =
    selected.confirmed === false
      ? "forming"
      : selected.mitigated
        ? "mitigated"
        : selected.swept
          ? "swept"
          : selected.reclaimed
            ? "reclaimed"
            : "confirmed";

  return (
    <dl className="overlay-verification">
      <div>
        <dt>Type</dt>
        <dd>{selected.kind || selected.type || "SMC"}</dd>
      </div>
      <div>
        <dt>Direction</dt>
        <dd>{selected.direction || "NEUTRAL"}</dd>
      </div>
      <div>
        <dt>Source</dt>
        <dd>
          {selected.sourceIndex ?? "—"} · {formatStamp(selected.startTime)}
        </dd>
      </div>
      <div>
        <dt>Confirmed</dt>
        <dd>
          {selected.confirmationIndex ?? "—"} · {formatStamp(selected.time)}
        </dd>
      </div>
      <div>
        <dt>Available</dt>
        <dd>{formatStamp(selected.firstAvailableTime)}</dd>
      </div>
      <div>
        <dt>Level</dt>
        <dd>{level}</dd>
      </div>
      <div>
        <dt>Status</dt>
        <dd>{status}</dd>
      </div>
    </dl>
  );
}

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setInterval] = useState("1h");
  const [limit, setLimit] = useState(100);

  const [market, setMarket] = useState(null);
  const [smcData, setSmcData] = useState(null);
  const [overlayVisible, setOverlayVisible] = useState(overlayDefaults);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [showDeveloperData, setShowDeveloperData] = useState(false);
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
      setSelectedOverlay(null);
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
      <Navbar>
        <details>
          <summary>Market</summary>
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
        </details>
        <details>
          <summary>SMC overlays</summary>
          <OverlayControls
            visible={overlayVisible}
            setVisible={setOverlayVisible}
          />
          <p className="navbar-help">
            FVG gap, BOS break of structure, CHoCH reversal, and dashed
            liquidity levels.
          </p>
        </details>
        <details>
          <summary>Verification</summary>
          <OverlayVerification selected={selectedOverlay} />
        </details>
        <details>
          <summary>Stats</summary>
          <StatisticalPanel market={market} />
        </details>
        <details>
          <summary>Developer</summary>
          <label className="developer-toggle">
            <input
              type="checkbox"
              checked={showDeveloperData}
              onChange={() => setShowDeveloperData((current) => !current)}
            />
            Show normalized Binance candle table
          </label>
        </details>
      </Navbar>
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
      <section className="chart" aria-label="Candlestick chart">
        <CandleChart
          candles={market?.data || []}
          visible={overlayVisible}
          onSelectOverlay={setSelectedOverlay}
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
      {showDeveloperData && (
        <div className="table" aria-label="Developer candle data">
          <CandleTable candles={market?.data || []} />
        </div>
      )}
    </DashboardLayout>
  );
}
