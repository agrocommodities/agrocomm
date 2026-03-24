import { getPageViewStats, getNewsWithViews } from "@/actions/admin";
import StatsCharts from "./StatsCharts";
import NewsViewsTable from "./NewsViewsTable";
import OnlineUsersWidget from "@/components/admin/OnlineUsersWidget";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estatísticas — Admin — AgroComm" };

export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ newsPage?: string }>;
}) {
  const { newsPage } = await searchParams;
  const currentPage = Math.max(1, Number(newsPage ?? 1) || 1);

  const [stats, newsStats] = await Promise.all([
    getPageViewStats(),
    getNewsWithViews(currentPage, 20),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas do Site</h1>
        <p className="text-sm text-white/50 mt-1">
          Monitoramento de visitas e engajamento — últimos 30 dias
        </p>
      </div>

      <OnlineUsersWidget />

      <StatsCharts stats={stats} />

      <NewsViewsTable
        articles={newsStats.articles}
        total={newsStats.total}
        page={newsStats.page}
        limit={newsStats.limit}
      />
    </div>
  );
}
