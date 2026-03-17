import Link from "next/link";
import { getAdminDashboard } from "@/actions/admin";
import {
  Users,
  DollarSign,
  CalendarCheck,
  Eye,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();

  const cards = [
    {
      label: "Usuários",
      value: data.totalUsers,
      icon: Users,
      href: "/admin/usuarios",
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      label: "Total de Cotações",
      value: data.totalQuotes,
      icon: DollarSign,
      href: "/admin/cotacoes",
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      label: "Cotações Hoje",
      value: data.todayQuotes,
      icon: CalendarCheck,
      href: "/admin/cotacoes",
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      label: "Visualizações",
      value: data.totalViews,
      icon: Eye,
      href: "/admin/estatisticas",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Painel de Administração</h1>
        <p className="text-sm text-white/50 mt-1">Visão geral do sistema</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className={`${card.bg} p-2 rounded-lg`}>
                <card.icon className={`w-5 h-5 ${card.color}`} />
              </div>
              <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 transition-colors" />
            </div>
            <p className="text-2xl font-bold">
              {card.value.toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-white/50 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/scraping"
          className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
        >
          <h3 className="font-semibold mb-1">Executar Scraping</h3>
          <p className="text-sm text-white/50">
            Coletar cotações manualmente das fontes ativas
          </p>
        </Link>
        <Link
          href="/admin/estatisticas"
          className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
        >
          <h3 className="font-semibold mb-1">Ver Estatísticas</h3>
          <p className="text-sm text-white/50">
            Monitorar visitas e engajamento do site
          </p>
        </Link>
      </div>

      {/* Recent scraper logs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="font-semibold">Últimas Execuções do Scraper</h2>
          <Link
            href="/admin/scraping"
            className="text-xs text-green-400 hover:underline"
          >
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Fonte</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">
                  Cotações
                </th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">
                  Data
                </th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-white/30">
                    Nenhuma execução registrada
                  </td>
                </tr>
              ) : (
                data.recentLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3">{log.sourceName ?? "Sistema"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.status === "success"
                            ? "bg-green-500/20 text-green-400"
                            : log.status === "error"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {log.status === "success"
                          ? "Sucesso"
                          : log.status === "error"
                            ? "Erro"
                            : "Ignorado"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white/60 hidden sm:table-cell">
                      {log.quotesInserted}
                    </td>
                    <td className="px-5 py-3 text-right text-white/40 text-xs hidden sm:table-cell">
                      {log.executedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
