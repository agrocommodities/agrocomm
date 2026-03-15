import { getScraperInfo } from "@/actions/admin";
import ScrapingManager from "./ScrapingManager";

export const dynamic = "force-dynamic";

export default async function AdminScrapingPage() {
  const data = await getScraperInfo();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Scraping de Dados</h1>
        <p className="text-sm text-white/50 mt-1">
          Gerencie fontes de dados e execute coletas manuais
        </p>
      </div>

      <ScrapingManager
        initialSources={data.allSources}
        initialLogs={data.logs}
      />
    </div>
  );
}
