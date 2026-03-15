import { getPageViewStats } from "@/actions/admin";
import StatsCharts from "./StatsCharts";

export const dynamic = "force-dynamic";
export const metadata = { title: "Estatísticas — Admin — AgroComm" };

export default async function AdminStatsPage() {
  const stats = await getPageViewStats();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Estatísticas do Site</h1>
        <p className="text-sm text-white/50 mt-1">
          Monitoramento de visitas e engajamento — últimos 30 dias
        </p>
      </div>

      <StatsCharts stats={stats} />
    </div>
  );
}
