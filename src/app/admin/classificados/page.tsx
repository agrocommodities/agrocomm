import { getAdminClassifieds } from "@/actions/adminClassifieds";
import ClassifiedsManager from "./ClassifiedsManager";

export const dynamic = "force-dynamic";

export default async function AdminClassificadosPage() {
  const data = await getAdminClassifieds();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Classificados</h1>
        <p className="text-sm text-white/50 mt-1">
          {data.total} anúncio{data.total !== 1 && "s"}
        </p>
      </div>
      <ClassifiedsManager initialData={data} />
    </div>
  );
}
