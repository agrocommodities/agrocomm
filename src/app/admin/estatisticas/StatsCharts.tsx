"use client";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Eye, Users, TrendingUp, Globe } from "lucide-react";

interface Stats {
  totalViews: number;
  recentViews: number;
  uniqueSessions: number;
  viewsPerDay: { date: string; views: number; uniqueVisitors: number }[];
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string | null; views: number }[];
}

function formatDate(dateStr: string) {
  const [, m, d] = dateStr.split("-");
  return `${d}/${m}`;
}

function formatReferrer(url: string | null): string {
  if (!url) return "Direto";
  try {
    return new URL(url).hostname;
  } catch {
    return url.slice(0, 40);
  }
}

export default function StatsCharts({ stats }: { stats: Stats }) {
  const avgPerDay =
    stats.viewsPerDay.length > 0
      ? Math.round(
          stats.viewsPerDay.reduce((s, d) => s + d.views, 0) /
            stats.viewsPerDay.length,
        )
      : 0;

  const cards = [
    {
      label: "Total de Visualizações",
      value: stats.totalViews.toLocaleString("pt-BR"),
      icon: Eye,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Últimos 30 Dias",
      value: stats.recentViews.toLocaleString("pt-BR"),
      icon: TrendingUp,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Visitantes Únicos (30d)",
      value: stats.uniqueSessions.toLocaleString("pt-BR"),
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
    {
      label: "Média Diária",
      value: avgPerDay.toLocaleString("pt-BR"),
      icon: Globe,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
  ];

  return (
    <>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white/5 border border-white/10 rounded-2xl p-5"
          >
            <div className={`${card.bg} p-2 rounded-lg w-fit mb-3`}>
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold">{card.value}</p>
            <p className="text-xs text-white/50 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Views per day chart */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-4">
          Visualizações por Dia
        </h2>
        {stats.viewsPerDay.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-white/40 text-sm">
            Sem dados disponíveis
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart
              data={stats.viewsPerDay}
              margin={{ top: 4, right: 8, bottom: 0, left: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.07)"
              />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={40}
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
              />
              <Line
                type="monotone"
                dataKey="views"
                name="Visualizações"
                stroke="#4ade80"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="uniqueVisitors"
                name="Visitantes únicos"
                stroke="#a78bfa"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top pages */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-sm text-white/70">
              Páginas Mais Visitadas
            </h2>
          </div>
          {stats.topPages.length === 0 ? (
            <div className="px-5 py-8 text-center text-white/30 text-sm">
              Sem dados
            </div>
          ) : (
            <div className="p-4">
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, stats.topPages.length * 36)}
              >
                <BarChart
                  data={stats.topPages}
                  layout="vertical"
                  margin={{ top: 0, right: 8, bottom: 0, left: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.07)"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="path"
                    tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={140}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#171717",
                      border: "1px solid rgba(255,255,255,0.12)",
                      borderRadius: 10,
                      color: "#fff",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="views"
                    name="Visualizações"
                    fill="#4ade80"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Top referrers */}
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold text-sm text-white/70">
              Principais Referências
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Origem</th>
                  <th className="text-right px-5 py-3 font-medium">Visitas</th>
                </tr>
              </thead>
              <tbody>
                {stats.topReferrers.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="text-center py-8 text-white/30">
                      Sem dados
                    </td>
                  </tr>
                ) : (
                  stats.topReferrers.map((ref) => (
                    <tr
                      key={ref.referrer ?? "direct"}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-5 py-3 text-white/60 truncate max-w-48">
                        {formatReferrer(ref.referrer)}
                      </td>
                      <td className="px-5 py-3 text-right font-semibold">
                        {ref.views}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
