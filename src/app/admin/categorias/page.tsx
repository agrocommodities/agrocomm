import { getAdminCategories } from "@/actions/adminClassifieds";
import CategoriesManager from "./CategoriesManager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriasPage() {
  const categories = await getAdminCategories();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Categorias de Classificados</h1>
        <p className="text-sm text-white/50 mt-1">
          {categories.length} categoria{categories.length !== 1 && "s"}
        </p>
      </div>
      <CategoriesManager initialCategories={categories} />
    </div>
  );
}
