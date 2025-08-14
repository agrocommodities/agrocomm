// src/components/prices/chart.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { Legend } from "recharts";

// Importação dinâmica do Recharts
const LineChart = dynamic(
  () => import("recharts").then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import("recharts").then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import("recharts").then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import("recharts").then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import("recharts").then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import("recharts").then((mod) => mod.Tooltip),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const Area = dynamic(
  () => import("recharts").then((mod) => mod.Area),
  { ssr: false }
);
const AreaChart = dynamic(
  () => import("recharts").then((mod) => mod.AreaChart),
  { ssr: false }
);

import { Calendar, TrendingUp, TrendingDown, Activity, Loader2 } from "lucide-react";

interface PriceData {
  id: number;
  price: number;
  date: string;
  variation: number | null;
  state: string; // Mudança: usar state em vez de stateCode
  city: string | null;
  commodity: string;
}

interface PriceChartProps {
  data?: PriceData[]; // Tornar opcional
  commodity: string;
  selectedState?: string;
}

type TimeRange = "7d" | "30d" | "3m" | "6m" | "1y" | "all";
type ChartType = "line" | "area";

export function PriceChart({ data = [], commodity, selectedState = "all" }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [chartType, setChartType] = useState<ChartType>("line");
  const [showVariation, setShowVariation] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  const [historicalData, setHistoricalData] = useState<PriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garantir que o componente só renderize no cliente
  useEffect(() => {
    setIsClient(true);
    const timer = setTimeout(() => {
      setChartReady(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Buscar dados históricos
  useEffect(() => {
    if (!isClient || !commodity) return;

    const fetchHistoricalData = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          commodity,
          limit: "365" // Buscar até 1 ano de dados
        });

        if (selectedState && selectedState !== "all") {
          params.append("state", selectedState);
        }

        const response = await fetch(`/api/prices/history?${params}`);
        
        if (!response.ok) {
          throw new Error("Erro ao buscar dados históricos");
        }

        const historicalPrices: PriceData[] = await response.json();
        
        console.log("PriceChart - Dados históricos carregados:", {
          total: historicalPrices.length,
          commodity,
          selectedState,
          dateRange: historicalPrices.length > 0 ? {
            first: historicalPrices[historicalPrices.length - 1]?.date,
            last: historicalPrices[0]?.date
          } : null
        });

        setHistoricalData(historicalPrices);
      } catch (err) {
        console.error("Erro ao buscar dados históricos:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [isClient, commodity, selectedState]);

  // Processar dados para o gráfico
  const chartData = useMemo(() => {
    const dataToProcess = historicalData.length > 0 ? historicalData : data;
    
    if (!dataToProcess || dataToProcess.length === 0) {
      console.log("PriceChart - Nenhum dado disponível para processar");
      return [];
    }

    try {
      console.log("PriceChart - Processando dados...", {
        source: historicalData.length > 0 ? "historical" : "props",
        total: dataToProcess.length
      });
      
      // Agrupar por data e calcular médias por dia
      const groupedByDate = dataToProcess.reduce((acc, item) => {
        const date = item.date;
        if (!acc[date]) {
          acc[date] = {
            date,
            prices: [],
            variations: [],
          };
        }
        acc[date].prices.push(item.price);
        if (item.variation !== null && item.variation !== undefined) {
          acc[date].variations.push(item.variation);
        }
        return acc;
      }, {} as Record<string, { date: string; prices: number[]; variations: number[] }>);

      console.log("PriceChart - Datas únicas encontradas:", Object.keys(groupedByDate).length);

      // Calcular médias e formatar para o gráfico
      const processedData = Object.entries(groupedByDate)
        .map(([dateKey, item]) => {
          const avgPrice = item.prices.reduce((a, b) => a + b, 0) / item.prices.length;
          const avgVariation = item.variations.length > 0
            ? item.variations.reduce((a, b) => a + b, 0) / item.variations.length
            : 0;

          return {
            date: item.date,
            dateObj: new Date(item.date + 'T12:00:00'), // Adicionar hora para evitar problemas de timezone
            displayDate: formatDateForChart(item.date),
            price: Number((avgPrice / 100).toFixed(2)),
            variation: Number((avgVariation / 100).toFixed(2)),
            count: item.prices.length,
          };
        })
        .filter(item => !isNaN(item.dateObj.getTime())) // Filtrar datas inválidas
        .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()); // Ordenar por data

      console.log("PriceChart - Dados processados:", {
        totalPoints: processedData.length,
        dateRange: processedData.length > 0 ? {
          first: processedData[0]?.date,
          last: processedData[processedData.length - 1]?.date
        } : null
      });

      // Filtrar por período
      const finalData = filterDataByTimeRange(processedData, timeRange);
      
      console.log("PriceChart - Dados após filtro de período:", {
        period: timeRange,
        points: finalData.length
      });

      return finalData;
    } catch (error) {
      console.error("Erro ao processar dados do gráfico:", error);
      setError("Erro ao processar dados do gráfico");
      return [];
    }
  }, [historicalData, data, timeRange]);

  // Estatísticas
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    try {
      const prices = chartData.map((d) => d.price).filter(p => !isNaN(p) && p > 0);
      if (prices.length === 0) return null;

      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
      const latest = prices[prices.length - 1];
      const first = prices[0];
      const change = first !== 0 ? ((latest - first) / first) * 100 : 0;

      return {
        min: min.toFixed(2),
        max: max.toFixed(2),
        avg: avg.toFixed(2),
        latest: latest.toFixed(2),
        change: change.toFixed(2),
        trend: change > 0 ? "up" : change < 0 ? "down" : "stable",
        dataPoints: chartData.length
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return null;
    }
  }, [chartData]);

  function formatDateForChart(dateStr: string): string {
    try {
      if (!dateStr) return "";
      
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      if (isNaN(date.getTime())) {
        return dateStr;
      }
      
      return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
    } catch (error) {
      return dateStr;
    }
  }

  function filterDataByTimeRange(dataArray: any[], range: TimeRange) {
    if (range === "all") return dataArray;

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
    }

    return dataArray.filter((item) => {
      const itemDate = new Date(item.date + 'T12:00:00');
      return itemDate >= startDate;
    });
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-white/20 p-3 rounded-lg shadow-lg">
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

  // Não renderizar no servidor
  if (!isClient) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4 sm:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-3"></div>
            <p className="text-white/60">Inicializando gráfico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4 sm:p-6">
      {/* Header com Título e Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Histórico de Preços
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          </h3>
          <p className="text-sm text-white/60 mt-1">
            {commodity.charAt(0).toUpperCase() + commodity.slice(1)}
            {selectedState !== "all" && ` - ${selectedState}`}
          </p>
          <p className="text-xs text-white/40 mt-1">
            {historicalData.length > 0 
              ? `${historicalData.length} registros históricos`
              : `${data.length} registros atuais`
            } | {chartData.length} pontos no gráfico
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {/* Filtro de Período */}
          <div className="flex bg-black/30 rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setTimeRange(option.value as TimeRange)}
                disabled={loading}
                className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 ${
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
              onClick={() => setChartType("line")}
              disabled={loading}
              className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 ${
                chartType === "line"
                  ? "bg-white text-background font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Linha
            </button>
            <button
              onClick={() => setChartType("area")}
              disabled={loading}
              className={`px-3 py-1 text-xs sm:text-sm rounded-md transition-colors disabled:opacity-50 ${
                chartType === "area"
                  ? "bg-white text-background font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              }`}
            >
              Área
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      {statistics && !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Pontos</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              {statistics.dataPoints}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-3">
            <p className="text-xs text-white/60 mb-1">Atual</p>
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
            <p className="text-xs text-white/60 mb-1">Média</p>
            <p className="text-lg sm:text-xl font-bold text-white">
              R$ {statistics.avg}
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Gráfico */}
      <div className="w-full h-64 sm:h-80" suppressHydrationWarning>
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-white/60 mx-auto mb-3 animate-spin" />
              <p className="text-white/60">Carregando dados históricos...</p>
            </div>
          </div>
        ) : chartData.length > 0 && chartReady ? (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === "line" ? (
              <LineChart 
                data={chartData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="displayDate"
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.7)" }} />
                <Line
                  type="monotone"
                  dataKey="price"
                  name="Preço"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: "#10b981", r: 3 }}
                  activeDot={{ r: 5, fill: "#10b981" }}
                  connectNulls={false}
                />
                {showVariation && (
                  <Line
                    type="monotone"
                    dataKey="variation"
                    name="Variação %"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={{ fill: "#f59e0b", r: 3 }}
                    activeDot={{ r: 5, fill: "#f59e0b" }}
                  />
                )}
              </LineChart>
            ) : (
              <AreaChart 
                data={chartData} 
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
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
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ color: "rgba(255,255,255,0.7)" }} />
                <Area
                  type="monotone"
                  dataKey="price"
                  name="Preço"
                  stroke="#10b981"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  connectNulls={false}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Calendar className="w-12 h-12 text-white/40 mx-auto mb-3" />
              <p className="text-white/60">
                {!chartReady 
                  ? "Preparando gráfico..."
                  : "Nenhum dado disponível para o período selecionado"
                }
              </p>
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
            disabled={loading}
            className="w-4 h-4 rounded border-white/20 bg-black/30 text-white focus:ring-white/50 disabled:opacity-50"
          />
          <span className="text-sm text-white/70">Mostrar variação percentual</span>
        </label>
        
        <p className="text-xs text-white/50">
          {loading ? "Carregando..." : `${chartData.length} pontos de dados`}
        </p>
      </div>
    </div>
  );
}