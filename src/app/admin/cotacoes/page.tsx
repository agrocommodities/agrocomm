import { getAdminQuotes, getQuoteFormData } from "@/actions/admin";
import QuotesManager from "./QuotesManager";

export const dynamic = "force-dynamic";

export default async function AdminQuotesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; product?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const product = params.product || undefined;

  const [quotesData, formData] = await Promise.all([
    getAdminQuotes(page, product),
    getQuoteFormData(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Gerenciar Cotações</h1>
        <p className="text-sm text-white/50 mt-1">
          {quotesData.total.toLocaleString("pt-BR")} cotações no total
        </p>
      </div>

      <QuotesManager
        initialData={quotesData}
        formOptions={formData}
        currentPage={page}
        currentProduct={product}
      />
    </div>
  );
}
