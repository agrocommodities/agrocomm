// src/components/prices/mini-chart.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface PriceData {
  date: string;
  price: number;
}

interface MiniChartProps {
  commodity: string;
  height?: number;
}

const COMMODITY_NAMES: Record<string, string> = {
  'soja': 'Soja',
  'milho': 'Milho',
  'boi': 'Boi Gordo',
  'vaca': 'Vaca Gorda',
};

export function MiniChart({ commodity, height = 80 }: MiniChartProps) {
  const [data, setData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    const fetchData = async () => {
      try {
        const response = await fetch(`/api/prices/history?commodity=${commodity}&limit=30`);
        if (response.ok) {
          const prices = await response.json();
          
          // Agrupar por data e calcular média
          const groupedByDate = prices.reduce((acc: any, item: any) => {
            const date = item.date;
            if (!acc[date]) {
              acc[date] = { date, prices: [] };
            }
            acc[date].prices.push(item.price);
            return acc;
          }, {});

          // Calcular médias e formatar
          const chartData = Object.values(groupedByDate)
            .map((item: any) => ({
              date: item.date,
              price: item.prices.reduce((sum: number, p: number) => sum + p, 0) / item.prices.length / 100,
            }))
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(-7); // Últimos 7 dias

          setData(chartData);
        }
      } catch (err) {
        console.error(`Erro ao carregar dados do gráfico ${commodity}:`, err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [commodity, isClient]);

  if (!isClient || loading) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">
            {COMMODITY_NAMES[commodity]}
          </h4>
        </div>
        <div className="flex items-center justify-center" style={{ height }}>
          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white/40"></div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">
            {COMMODITY_NAMES[commodity]}
          </h4>
        </div>
        <div className="flex items-center justify-center text-white/40 text-xs" style={{ height }}>
          Sem dados
        </div>
      </div>
    );
  }

  const trend = data.length > 1 ? data[data.length - 1].price - data[0].price : 0;
  const currentPrice = data[data.length - 1]?.price || 0;

  return (
    <Link href={`/cotacoes/${commodity}`} className="block group">
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-3 hover:bg-background/90 transition-colors">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
            {COMMODITY_NAMES[commodity]}
          </h4>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">
              R$ {currentPrice.toFixed(2).replace('.', ',')}
            </span>
            <span className={`text-xs ${trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-white/60'}`}>
              {trend > 0 ? '↗' : trend < 0 ? '↘' : '→'}
            </span>
          </div>
        </div>
        
        <div style={{ height }} suppressHydrationWarning>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <Line
                type="monotone"
                dataKey="price"
                stroke={trend > 0 ? "#10b981" : trend < 0 ? "#ef4444" : "#6b7280"}
                strokeWidth={1.5}
                dot={false}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Link>
  );
}