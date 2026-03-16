"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import type { HistoryPoint, CityLine } from "@/actions/quotes";

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

// Paleta de cores para linhas secundárias
const SECONDARY_COLORS = [
  "#60a5fa",
  "#f472b6",
  "#fb923c",
  "#a78bfa",
  "#34d399",
  "#fbbf24",
  "#38bdf8",
  "#e879f9",
  "#4ade80",
  "#f87171",
  "#818cf8",
  "#2dd4bf",
];

// ── Modo multi-linha (cidades) ────────────────────────────────────────────────

interface MultiLineProps {
  lines: CityLine[];
  unit: string;
  highlightCityId?: number;
  data?: never;
  color?: never;
}

// ── Modo linha única (média nacional / histórico simples) ─────────────────────

interface SingleLineProps {
  data: HistoryPoint[];
  unit: string;
  color?: string;
  lines?: never;
  highlightCityId?: never;
}

type Props = MultiLineProps | SingleLineProps;

export default function QuoteChart(props: Props) {
  const { unit } = props;

  // ── Single-line mode ────────────────────────────────────────────────────────
  if (props.data !== undefined) {
    const { data, color = "#4ade80" } = props;
    if (data.length === 0) return <EmptyState />;

    const prices = data.map((d) => d.price);
    const [min, max] = [Math.min(...prices), Math.max(...prices)];
    const pad = (max - min) * 0.15 || 1;

    return (
      <ResponsiveContainer width="100%" height={220}>
        <LineChart
          data={data}
          margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255,255,255,0.07)"
          />
          <XAxis dataKey="date" tickFormatter={formatDate} {...axisProps} />
          <YAxis
            domain={[min - pad, max + pad]}
            tickFormatter={(v) => v.toFixed(0)}
            {...axisProps}
            width={48}
          />
          <Tooltip
            {...tooltipProps(unit)}
            labelFormatter={(l) => formatDate(String(l))}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, fill: color }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // ── Multi-line mode ─────────────────────────────────────────────────────────
  const { lines, highlightCityId } = props;
  if (!lines || lines.length === 0) return <EmptyState />;

  // Mescla todas as datas
  const allDates = [
    ...new Set(lines.flatMap((l) => l.points.map((p) => p.date))),
  ].sort();

  type ChartPoint = { date: string } & {
    [k: string]: string | number | undefined;
  };
  const chartData: ChartPoint[] = allDates.map((date) => {
    const point: ChartPoint = { date };
    for (const line of lines) {
      const p = line.points.find((p) => p.date === date);
      if (p) point[`${line.city}/${line.state}`] = p.price;
    }
    return point;
  });

  const allPrices = lines.flatMap((l) => l.points.map((p) => p.price));
  const [min, max] = [Math.min(...allPrices), Math.max(...allPrices)];
  const pad = (max - min) * 0.15 || 1;

  let colorIdx = 0;
  const lineColors = lines.map((line) => {
    if (line.cityId === highlightCityId) return "#4ade80";
    return SECONDARY_COLORS[colorIdx++ % SECONDARY_COLORS.length];
  });

  return (
    <ResponsiveContainer width="100%" height={lines.length > 4 ? 280 : 240}>
      <LineChart
        data={chartData}
        margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
        <XAxis dataKey="date" tickFormatter={formatDate} {...axisProps} />
        <YAxis
          domain={[min - pad, max + pad]}
          tickFormatter={(v) => v.toFixed(0)}
          {...axisProps}
          width={48}
        />
        <Tooltip
          {...tooltipProps(unit)}
          labelFormatter={(l) => formatDate(String(l))}
          formatter={(value, name) => {
            const num = typeof value === "number" ? value : Number(value);
            return [`${unit.split(" ")[0]} ${num.toFixed(2)}`, String(name)];
          }}
        />
        {lines.length > 1 && (
          <Legend
            wrapperStyle={{
              fontSize: 11,
              color: "rgba(255,255,255,0.5)",
              paddingTop: 8,
            }}
          />
        )}
        {lines.map((line, i) => {
          const key = `${line.city}/${line.state}`;
          const isHighlight = line.cityId === highlightCityId;
          return (
            <Line
              key={line.cityId}
              type="monotone"
              dataKey={key}
              stroke={lineColors[i]}
              strokeWidth={isHighlight ? 2.5 : 1.5}
              strokeOpacity={isHighlight || !highlightCityId ? 1 : 0.35}
              dot={false}
              activeDot={{ r: 4, fill: lineColors[i] }}
              connectNulls
            />
          );
        })}
      </LineChart>
    </ResponsiveContainer>
  );
}

// ── Shared style helpers ──────────────────────────────────────────────────────

const axisProps = {
  tick: { fill: "rgba(255,255,255,0.4)", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
  interval: "preserveStartEnd" as const,
};

function tooltipProps(unit: string) {
  return {
    contentStyle: {
      background: "#171717",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      color: "#fff",
      fontSize: 13,
    },
    formatter: (value: unknown) => {
      const num = typeof value === "number" ? value : Number(value);
      return [`${unit.split(" ")[0]} ${num.toFixed(2)}`, "Preço"] as [
        string,
        string,
      ];
    },
  };
}

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-48 text-white/40 text-sm">
      Sem dados disponíveis
    </div>
  );
}
