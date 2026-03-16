"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, TrendingDown, ChevronDown, Minus } from "lucide-react";
import { io, type Socket } from "socket.io-client";

interface CommodityData {
  name: string;
  unit: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  history: number[];
  timestamp: number;
  exchangeRate: number | null;
}

const COMMODITIES = [
  { key: "soja", label: "Soja", emoji: "🌱" },
  { key: "milho", label: "Milho", emoji: "🌽" },
  { key: "boi", label: "Boi Gordo", emoji: "🐄" },
];

function MiniChart({
  data,
  width = 220,
  height = 80,
}: {
  data: number[];
  width?: number;
  height?: number;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;

  const points = data
    .map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((v - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? "#4ade80" : "#f87171";
  const gradientId = `grad-${isUp ? "up" : "down"}`;

  // Area fill path
  const firstX = padding;
  const lastX =
    padding + ((data.length - 1) / (data.length - 1)) * (width - padding * 2);
  const areaPath = `M ${firstX},${height} L ${points
    .split(" ")
    .map((p) => p)
    .join(" L ")} L ${lastX},${height} Z`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ maxHeight: height }}
      role="img"
      aria-label="Gráfico de tendência"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradientId})`} />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {(() => {
        const lastPoint = points.split(" ").pop()?.split(",");
        if (!lastPoint) return null;
        return (
          <>
            <circle
              cx={lastPoint[0]}
              cy={lastPoint[1]}
              r="4"
              fill={color}
              className="animate-pulse"
            />
            <circle cx={lastPoint[0]} cy={lastPoint[1]} r="2" fill="white" />
          </>
        );
      })()}
    </svg>
  );
}

export default function CommoditySidebar() {
  const [selected, setSelected] = useState("soja");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, CommodityData | null>>(
    {},
  );
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch initial data via API
  useEffect(() => {
    fetch("/api/commodities")
      .then((r) => r.json())
      .then((data) => setPrices(data))
      .catch(() => {});
  }, []);

  // Socket.IO connection
  useEffect(() => {
    const socket = io({
      path: "/api/socketio",
      transports: ["websocket", "polling"],
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("subscribe:commodity", selected);
    });

    socket.on("disconnect", () => setConnected(false));

    socket.on(
      "commodity:update",
      (data: CommodityData & { commodity: string }) => {
        setPrices((prev) => ({
          ...prev,
          [data.commodity]: {
            name: data.name ?? prev[data.commodity]?.name ?? data.commodity,
            unit: data.unit ?? prev[data.commodity]?.unit ?? "",
            currency: data.currency ?? prev[data.commodity]?.currency ?? "USD",
            price: data.price,
            change: data.change,
            changePercent: data.changePercent,
            history: data.history,
            timestamp: data.timestamp,
            exchangeRate:
              data.exchangeRate ?? prev[data.commodity]?.exchangeRate ?? null,
          },
        }));
      },
    );

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  // Re-subscribe on commodity change
  const handleSelect = useCallback(
    (key: string) => {
      const socket = socketRef.current;
      if (socket?.connected) {
        socket.emit("unsubscribe:commodity", selected);
        socket.emit("subscribe:commodity", key);
      }
      setSelected(key);
      setDropdownOpen(false);
    },
    [selected],
  );

  const current = COMMODITIES.find((c) => c.key === selected);
  const data = prices[selected];

  return (
    <aside className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
      {/* Header with dropdown */}
      <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-white/40">
            Chicago Board of Trade
          </span>
          {/* Connection indicator */}
          <span
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-400 animate-pulse" : "bg-yellow-400"
            }`}
            title={connected ? "Conectado em tempo real" : "Reconectando..."}
          />
        </div>
      </div>

      {/* Dropdown selector */}
      <div className="px-4 pt-3" ref={dropdownRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="w-full flex items-center justify-between gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{current?.emoji}</span>
              <span>{current?.label}</span>
            </span>
            <ChevronDown
              className={`w-4 h-4 text-white/40 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute z-10 w-full mt-1 bg-[#2a3525] border border-white/15 rounded-lg shadow-xl overflow-hidden">
              {COMMODITIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => handleSelect(c.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-colors cursor-pointer ${
                    c.key === selected
                      ? "bg-green-500/20 text-green-300"
                      : "hover:bg-white/10"
                  }`}
                >
                  <span>{c.emoji}</span>
                  <span>{c.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Price display */}
      <div className="px-4 py-4">
        {data ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-2xl font-bold tabular-nums">
                  <span className="text-white/50 text-base mr-1">US$</span>
                  {data.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p className="text-xs text-white/40 mt-0.5">
                  {data.unit ?? "USD"}
                </p>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-semibold ${
                  data.change > 0
                    ? "text-green-400"
                    : data.change < 0
                      ? "text-red-400"
                      : "text-white/40"
                }`}
              >
                {data.change > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : data.change < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Minus className="w-4 h-4" />
                )}
                <span>
                  {data.change > 0 ? "+" : ""}
                  {data.changePercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* BRL conversion */}
            {data.exchangeRate && (
              <div className="bg-white/5 rounded-lg px-3 py-2 border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold tabular-nums text-green-300">
                      <span className="text-green-300/50 text-sm mr-1">R$</span>
                      {(data.price * data.exchangeRate).toLocaleString(
                        "pt-BR",
                        { minimumFractionDigits: 2, maximumFractionDigits: 2 },
                      )}
                    </p>
                    <p className="text-[10px] text-white/30">
                      Dólar: R${" "}
                      {data.exchangeRate.toLocaleString("pt-BR", {
                        minimumFractionDigits: 4,
                        maximumFractionDigits: 4,
                      })}
                    </p>
                  </div>
                  <span className="text-[10px] text-white/20 bg-white/5 px-1.5 py-0.5 rounded">
                    BRL
                  </span>
                </div>
              </div>
            )}

            {/* Mini chart */}
            {data.history && data.history.length >= 2 && (
              <div className="mt-1">
                <MiniChart data={data.history} />
                <div className="flex justify-between text-[10px] text-white/25 mt-1 px-1">
                  <span>5d atrás</span>
                  <span>Agora</span>
                </div>
              </div>
            )}

            {/* Last update */}
            <p className="text-[10px] text-white/20 text-right">
              {new Date(data.timestamp).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-white/30">
            <div className="w-6 h-6 border-2 border-white/20 border-t-green-400 rounded-full animate-spin" />
            <p className="text-xs">Carregando cotações...</p>
          </div>
        )}
      </div>

      {/* Footer info */}
      <div className="px-4 py-2.5 border-t border-white/5 bg-white/2">
        <Link
          href="/cotacoes/chicago"
          className="block text-[10px] text-white/25 text-center hover:text-green-400 transition-colors"
        >
          Futures — CME Group / CBOT →
        </Link>
      </div>
    </aside>
  );
}
