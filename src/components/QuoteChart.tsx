"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import type { HistoryPoint } from "@/actions/quotes";

interface Props {
  data: HistoryPoint[];
  unit: string;
  color?: string;
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

export default function QuoteChart({ data, unit, color = "#4ade80" }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-white/40 text-sm">
        Sem dados disponíveis
      </div>
    );
  }

  const prices = data.map((d) => d.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const padding = (max - min) * 0.15 || 1;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[min - padding, max + padding]}
          tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => v.toFixed(0)}
          width={48}
        />
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            color: "#fff",
            fontSize: 13,
          }}
          labelFormatter={(label) => formatDate(String(label))}
          formatter={(value) => {
            const num = typeof value === "number" ? value : Number(value);
            return [`${unit.split(" ")[0]} ${num.toFixed(2)}`, "Preço"] as [
              string,
              string,
            ];
          }}
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
