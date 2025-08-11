"use client";

import { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Calendar, TrendingUp, TrendingDown, Activity } from "lucide-react";

interface PriceData {
  id: number;
  price: number;
  date: string;
  variation: number | null;
  stateCode: string;
  stateName: string;
  cityName: string | null;
}

interface PriceChartProps {
  data: PriceData[];
  commodity: string;
  selectedState?: string;
}

type TimeRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";
type ChartType = "line" | "area";

export function PriceChart({ data, commodity, selectedState = "all" }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [chartType, setChartType] = useState<ChartType>("area");
  const [showVariation, setShowVariation] = useState(false);

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Agrupar por data e calcular média
    const groupedByDate = data.reduce((acc, item) => {
      const date = item.date;
      if (!acc[date]) {
        acc[date] = {
          date,
          prices: [],
          variations: [],
        };
      }
      acc[date].prices.push(item.price);
      if (item.variation !== null) {
        acc[date].variations.push(item.variation);
      }
      return acc;
    }, {} as Record<string, { date: string; prices: number[]; variations: number[] }>);

    // Calcular médias e formatar para o gráfico
    const processedData = Object.values(groupedByDate)
      .map((item) => {
        const avgPrice = item.prices.reduce((a, b) => a + b, 0) / item.prices.length;
        const avgVariation = item.variations.length > 0
          ? item.variations.reduce((a, b) => a + b, 0) / item.variations.length
          : 0;

        return {
          date: item.date,
          displayDate: formatDateForChart(item.date),
          price: parseFloat((avgPrice / 100).toFixed(2)),
          variation: parseFloat((avgVariation / 100).toFixed(2)),
          count: item.prices.length,
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Filtrar por período
    const filteredData = filterDataByTimeRange(processedData, timeRange);

    return filteredData;
  }, [data, timeRange]);

  // Estatísticas
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const prices = chartData.map((d) => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    const latest = prices[prices.length - 1];
    const first = prices[0];
    const change = ((latest - first) / first) * 100;

    return {
      min: min.toFixed(2),
      max: max.toFixed(2),
      avg: avg.toFixed(2),
      latest: latest.toFixed(2),
      change: change.toFixed(2),
      trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
    };
  }, [chartData]);

  function formatDateForChart(dateStr: string): string {
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}`;
  }

  function filterDataByTimeRange(data: any[], range: TimeRange) {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "3m":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "6m":
        startDate.setMonth(now.getMonth() - 6);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        return data;
    }

    return data.filter((item) => new Date(item.date) >= startDate);
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background/95 border-2 border-white/20 p-3 rounded-lg shadow-lg">
          <p className="text-white font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="text-sm">
              <span className="text-white/70">{entry.name}: </span>
              <span className="text-white font-medium">
                {entry.name === "Preço" ? `R$ ${entry.value}` : `${entry.value}%`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const timeRangeOptions = [
    { value: "7d", label: "7 dias" },
    { value: "30d", label: "30 dias" },
    { value: "3m", label: "3 meses" },
    { value: "6m", label: "6 meses" },
    { value: "1y", label: "1 ano" },
    { value: "all", label: "Tudo" },
  ];

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4 sm:p-6">
      {/* Header com Título e Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Histórico de Preços
          </h3>
          <p className="text-sm text-white/60 mt-1">
            {commodity.charAt(0).toUpperCase() + commodity.slice(1)}
            {selectedState !== "all" && ` - ${selectedState}`}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filtro de Período */}
          <div className="flex bg-black/30 rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                  timeRange === option.value
                    ? "bg-white text-background font-medium"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Toggle Tipo de Gráfico */}
          <div className="flex bg-black/30 rounded-lg p-1">
            <button
              onClick={() => setChartType("area")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                chartType === "area"
                  ? "bg-white text-background font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Área
            </button>
            <button
              onClick={() => setChartType("line")}
              className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors ${
                chartType === "line"
                  ? "bg-white text-background font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Linha
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {statistics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Preço Atual</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {statistics.latest}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Variação</p>
            <p
              className={`text-lg sm:text-xl font-bold flex items-center gap-1 ${
                parseFloat(statistics.change) > 0
                  ? "text-green-400"
                  : parseFloat(statistics.change) < 0
                  ? "text-red-400"
                  : "text-white"
              }`}
            >
              {parseFloat(statistics.change) > 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : parseFloat(statistics.change) < 0 ? (
                <TrendingDown className="w-4 h-4" />
              ) : null}
              {statistics.change}%
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Mínimo</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {statistics.min}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Máximo</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {statistics.max}
            </p>
          </div>
        </div>
      )}

      {/* Gráfico */}
      <div className="w-full h-64 sm:h-80">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorVariation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
                  iconType="line"
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  name="Preço"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                />
                {showVariation && (
                  <Area
                    type="monotone"
                    dataKey="variation"
                    name="Variação %"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#colorVariation)"
                  />
                )}
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  domain={["dataMin - 5", "dataMax + 5"]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
                  iconType="line"
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Preço"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 5 }}
                />
                {showVariation && (
                  <Line
                    type="monotone"
                    dataKey="variation"
                    name="Variação %"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                )}
              </LineChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">Nenhum dado disponível para o período selecionado</p>
            </div>
          </div>
        )}
      </div>

      {/* Toggle para mostrar variação */}
      <div className="mt-4 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showVariation}
            onChange={(e) => setShowVariation(e.target.checked)}
            className="w-4 h-4 rounded border-white/20 bg-black/30 text-white focus:ring-white/50"
          />
          <span className="text-sm text-white/70">Mostrar variação percentual</span>
        </label>
        
        <p className="text-xs text-white/50">
          {chartData.length} pontos de dados
        </p>
      </div>
    </div>
  );
}