"use client";

import { useState, useTransition, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import { Minus, ArrowDown, ArrowUp, Activity, Loader2 } from "lucide-react";
import type { HistoryPoint } from "@/actions/quotes";
import {
  getCityHistoryByRange,
  getChicagoHistoryByRange,
} from "@/actions/quotes";

// ── Range options ─────────────────────────────────────────────────────────────

export const RANGE_OPTIONS = [
  { label: "5D", value: 5, full: "5 dias" },
  { label: "7D", value: 7, full: "7 dias" },
  { label: "1M", value: 30, full: "1 mês" },
  { label: "3M", value: 90, full: "3 meses" },
  { label: "6M", value: 180, full: "6 meses" },
  { label: "1A", value: 365, full: "1 ano" },
  { label: "5A", value: 1825, full: "5 anos" },
  { label: "10A", value: 3650, full: "10 anos" },
  { label: "Tudo", value: 0, full: "Todo o período" },
] as const;

export type RangeValue = (typeof RANGE_OPTIONS)[number]["value"];

// ── Date formatting ───────────────────────────────────────────────────────────

function formatDateShort(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function formatDateFull(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

// ── Stats computation ─────────────────────────────────────────────────────────

export interface QuoteStats {
  current: number;
  min: number;
  max: number;
  avg: number;
  change: number;
  changePercent: number;
}

export function computeStats(data: HistoryPoint[]): QuoteStats | null {
  if (data.length === 0) return null;
  const prices = data.map((d) => d.price);
  const current = prices[prices.length - 1];
  const first = prices[0];
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
  const change = current - first;
  const changePercent = first !== 0 ? (change / first) * 100 : 0;
  return { current, min, max, avg, change, changePercent };
}

// ── Range selector pills ─────────────────────────────────────────────────────

interface RangeSelectorProps {
  value: RangeValue;
  onChange: (v: RangeValue) => void;
  loading?: boolean;
}

export function RangeSelector({
  value,
  onChange,
  loading,
}: RangeSelectorProps) {
  return (
    <div className="flex items-center gap-1 flex-wrap">
      {RANGE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          disabled={loading}
          className={`px-1 md:px-2.5 py-0.5 md:py-1 rounded-md text-xs font-medium transition-all ${
            value === opt.value
              ? "bg-green-500/20 text-green-400 ring-1 ring-green-500/30"
              : "text-white/40 hover:text-white/70 hover:bg-white/5"
          } disabled:opacity-50`}
          title={opt.full}
        >
          {opt.label}
        </button>
      ))}
      {loading && (
        <Loader2 className="w-3.5 h-3.5 text-green-400 animate-spin ml-1" />
      )}
    </div>
  );
}

// ── Stats display ─────────────────────────────────────────────────────────────

interface StatsBarProps {
  stats: QuoteStats;
  unit: string;
}

export function StatsBar({ stats, unit }: StatsBarProps) {
  const prefix = unit.split(" ")[0];
  const isPositive = stats.change >= 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {/* Current */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Activity className="w-3 h-3 text-green-400" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            Atual
          </span>
        </div>
        <p className="text-lg font-bold tabular-nums">
          {prefix} {stats.current.toFixed(2)}
        </p>
        <span
          className={`text-xs font-semibold ${isPositive ? "text-green-400" : "text-red-400"}`}
        >
          {isPositive ? "+" : ""}
          {stats.changePercent.toFixed(2)}%
        </span>
      </div>

      {/* Min */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowDown className="w-3 h-3 text-red-400" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            Mínimo
          </span>
        </div>
        <p className="text-lg font-bold tabular-nums text-red-400">
          {prefix} {stats.min.toFixed(2)}
        </p>
      </div>

      {/* Max */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <ArrowUp className="w-3 h-3 text-green-400" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            Máximo
          </span>
        </div>
        <p className="text-lg font-bold tabular-nums text-green-400">
          {prefix} {stats.max.toFixed(2)}
        </p>
      </div>

      {/* Avg */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Minus className="w-3 h-3 text-blue-400" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            Média
          </span>
        </div>
        <p className="text-lg font-bold tabular-nums text-blue-400">
          {prefix} {stats.avg.toFixed(2)}
        </p>
      </div>
    </div>
  );
}

// ── Main QuoteChart ───────────────────────────────────────────────────────────

interface QuoteChartProps {
  data: HistoryPoint[];
  unit: string;
  color?: string;
  /** If provided, enables dynamic range fetching for domestic quotes */
  productSlug?: string;
  cityId?: number;
  /** If provided, enables dynamic range fetching for Chicago quotes */
  chicagoKey?: string;
  /** Show range selector */
  showRangeSelector?: boolean;
  /** Initial range in days (default 30) */
  initialRange?: RangeValue;
  /** Chart height */
  height?: number;
}

export default function QuoteChart({
  data: initialData,
  unit,
  color = "#4ade80",
  productSlug,
  cityId,
  chicagoKey,
  showRangeSelector = true,
  initialRange = 30,
  height = 280,
}: QuoteChartProps) {
  const [range, setRange] = useState<RangeValue>(initialRange);
  const [data, setData] = useState<HistoryPoint[]>(initialData);
  const [isPending, startTransition] = useTransition();

  const handleRangeChange = useCallback(
    (newRange: RangeValue) => {
      setRange(newRange);
      if (chicagoKey) {
        startTransition(async () => {
          const history = await getChicagoHistoryByRange(chicagoKey, newRange);
          setData(history);
        });
      } else if (productSlug && cityId) {
        startTransition(async () => {
          const history = await getCityHistoryByRange(
            productSlug,
            cityId,
            newRange,
          );
          setData(history);
        });
      }
    },
    [productSlug, cityId, chicagoKey],
  );

  const stats = computeStats(data);

  if (data.length === 0 && !isPending) return <EmptyState />;

  const prices = data.map((d) => d.price);
  const [min, max] = [Math.min(...prices), Math.max(...prices)];
  const pad = (max - min) * 0.15 || 1;
  const avgPrice = stats?.avg ?? 0;

  const gradientId = `chartGradient-${color.replace("#", "")}`;

  return (
    <div className="flex flex-col gap-4">
      {/* Range selector */}
      {showRangeSelector && (
        <div className="flex items-center justify-between flex-wrap gap-2">
          <RangeSelector
            value={range}
            onChange={handleRangeChange}
            loading={isPending}
          />
        </div>
      )}

      {/* Stats */}
      {stats && <StatsBar stats={stats} unit={unit} />}

      {/* Chart */}
      <div className="relative">
        {isPending && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 rounded-xl backdrop-blur-[1px]">
            <Loader2 className="w-6 h-6 text-green-400 animate-spin" />
          </div>
        )}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.06)"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateShort}
              {...axisProps}
            />
            <YAxis
              domain={[min - pad, max + pad]}
              tickFormatter={(v: number) => v.toFixed(0)}
              {...axisProps}
              width={52}
            />
            {/* Average reference line */}
            <ReferenceLine
              y={avgPrice}
              stroke="rgba(96,165,250,0.3)"
              strokeDasharray="6 4"
              label={{
                value: `Média ${avgPrice.toFixed(0)}`,
                fill: "rgba(96,165,250,0.5)",
                fontSize: 10,
                position: "insideTopRight",
              }}
            />
            <Tooltip
              contentStyle={{
                background: "#171717",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
                padding: "10px 14px",
              }}
              labelFormatter={(l) => formatDateFull(String(l))}
              formatter={(value: unknown) => {
                const num = typeof value === "number" ? value : Number(value);
                return [`${unit.split(" ")[0]} ${num.toFixed(2)}`, "Preço"] as [
                  string,
                  string,
                ];
              }}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2.5}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{
                r: 5,
                fill: color,
                stroke: "#fff",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const axisProps = {
  tick: { fill: "rgba(255,255,255,0.4)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
  interval: "preserveStartEnd" as const,
};

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-white/40 text-sm">
      Sem dados disponíveis
    </div>
  );
}
