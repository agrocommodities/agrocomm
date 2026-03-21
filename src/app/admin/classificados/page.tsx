import Link from "next/link";
import { Plus } from "lucide-react";
import { getAdminClassifieds } from "@/actions/adminClassifieds";
import ClassifiedsManager from "./ClassifiedsManager";

export const dynamic = "force-dynamic";

export default async function AdminClassificadosPage() {
  const data = await getAdminClassifieds();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Classificados</h1>
          <p className="text-sm text-white/50 mt-1">
            {data.total} anúncio{data.total !== 1 && "s"}
          </p>
        </div>
        <Link
          href="/classificados/novo"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Criar Classificado</span>
          <span className="sm:hidden">Criar</span>
        </Link>
      </div>
      <ClassifiedsManager initialData={data} />
    </div>
  );
}
