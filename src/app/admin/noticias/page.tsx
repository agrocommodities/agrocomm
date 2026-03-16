import { getAdminNews, getNewsSources } from "@/actions/admin";
import NewsManager from "./NewsManager";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; categoria?: string }>;
}) {
  const { page, categoria } = await searchParams;
  const currentPage = Number(page) || 1;
  const [data, nsSources] = await Promise.all([
    getAdminNews(currentPage, categoria),
    getNewsSources(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Notícias</h1>
        <p className="text-sm text-white/50 mt-1">
          Gerencie notícias coletadas e execute coletas manuais
        </p>
      </div>

      <NewsManager
        initialData={data}
        currentPage={currentPage}
        currentCategory={categoria}
        initialSources={nsSources}
      />
    </div>
  );
}
