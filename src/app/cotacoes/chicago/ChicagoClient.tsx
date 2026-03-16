"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Minus, RefreshCw } from "lucide-react";

interface CommodityData {
  name: string;
  unit: string;
  symbol: string;
  category: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  exchangeRate: number | null;
  timestamp: number;
}

const CATEGORIES = [
  { key: "all", label: "Todos" },
  { key: "graos", label: "🌾 Grãos" },
  { key: "pecuaria", label: "🐄 Pecuária" },
  { key: "outros", label: "📦 Outros" },
];

function MiniChart({
  data,
  width = 120,
  height = 40,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#4ade80" : "#f87171";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: height }}
      role="img"
      aria-label="Gráfico de tendência"
    >
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ChicagoClient() {
  const [prices, setPrices] = useState<Record<string, CommodityData | null>>(
    {},
  );
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [showBrl, setShowBrl] = useState(true);

  const fetchPrices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/commodities/chicago");
      const data = await res.json();
      setPrices(data);
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60_000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const entries = Object.entries(prices).filter(([, v]) => v != null) as [
    string,
    CommodityData,
  ][];

  const filtered =
    category === "all"
      ? entries
      : entries.filter(([, v]) => v.category === category);

  const exchangeRate = entries[0]?.[1]?.exchangeRate ?? null;

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Category filter */}
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setCategory(cat.key)}
              className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                category === cat.key
                  ? "bg-green-500/20 text-green-300 border border-green-500/30"
                  : "bg-white/5 hover:bg-white/10 border border-white/10"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {/* BRL toggle */}
          <button
            type="button"
            onClick={() => setShowBrl(!showBrl)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              showBrl
                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                : "bg-white/5 hover:bg-white/10 border border-white/10"
            }`}
          >
            {showBrl ? "R$ BRL" : "US$ USD"}
          </button>

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchPrices}
            disabled={loading}
            className="text-xs text-white/40 hover:text-white/70 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Exchange rate banner */}
      {exchangeRate && (
        <div className="bg-white/3 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-white/50">💵 Dólar comercial:</span>
            <span className="text-lg font-bold tabular-nums text-green-300">
              R${" "}
              {exchangeRate.toLocaleString("pt-BR", {
                minimumFractionDigits: 4,
                maximumFractionDigits: 4,
              })}
            </span>
          </div>
          <span className="text-[10px] text-white/25">
            Atualizado em tempo real
          </span>
        </div>
      )}

      {/* Loading */}
      {loading && entries.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-white/30">
          <div className="w-8 h-8 border-2 border-white/20 border-t-green-400 rounded-full animate-spin" />
          <p className="text-sm">Carregando cotações de Chicago...</p>
        </div>
      )}

      {/* Commodities grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(([key, data]) => (
            <CommodityCard key={key} data={data} showBrl={showBrl} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-16 text-white/30">
          <p className="text-sm">Nenhuma cotação disponível no momento.</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-white/25 mt-4">
        <p>
          Dados de futuros da CME Group / Chicago Board of Trade (CBOT).
          Cotações com atraso de até 15 minutos.
        </p>
      </div>
    </div>
  );
}

function CommodityCard({
  data,
  showBrl,
}: {
  data: CommodityData;
  showBrl: boolean;
}) {
  const isUp = data.change > 0;
  const isDown = data.change < 0;
  const colorClass = isUp
    ? "text-green-400"
    : isDown
      ? "text-red-400"
      : "text-white/40";
  const borderColor = isUp
    ? "border-green-500/20"
    : isDown
      ? "border-red-500/20"
      : "border-white/10";

  const priceUsd = data.price.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const priceBrl = data.exchangeRate
    ? (data.price * data.exchangeRate).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <div
      className={`bg-white/3 border ${borderColor} rounded-xl p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-sm">{data.name}</h3>
          <p className="text-[10px] text-white/30">{data.symbol}</p>
        </div>
        <span className="text-[10px] text-white/20 bg-white/5 px-2 py-0.5 rounded">
          {data.unit}
        </span>
      </div>

      {/* Price */}
      <div className="flex items-end justify-between">
        <div>
          {showBrl && priceBrl ? (
            <>
              <p className="text-xl font-bold tabular-nums text-green-300">
                <span className="text-green-300/50 text-sm mr-0.5">R$</span>
                {priceBrl}
              </p>
              <p className="text-xs text-white/40 tabular-nums mt-0.5">
                US$ {priceUsd}
              </p>
            </>
          ) : (
            <p className="text-xl font-bold tabular-nums">
              <span className="text-white/50 text-sm mr-0.5">US$</span>
              {priceUsd}
            </p>
          )}
        </div>
        <div
          className={`flex items-center gap-1 text-sm font-semibold ${colorClass}`}
        >
          {isUp ? (
            <TrendingUp className="w-4 h-4" />
          ) : isDown ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          <span>
            {isUp ? "+" : ""}
            {data.changePercent.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Mini chart */}
      {data.history && data.history.length >= 2 && (
        <div className="mt-auto">
          <MiniChart data={data.history} />
          <div className="flex justify-between text-[9px] text-white/20 mt-0.5 px-0.5">
            <span>5d</span>
            <span>Agora</span>
          </div>
        </div>
      )}

      {/* Time */}
      <p className="text-[9px] text-white/15 text-right">
        {new Date(data.timestamp).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </p>
    </div>
  );
}
