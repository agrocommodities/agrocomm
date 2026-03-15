"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, ChevronLeft, ChevronRight, Scissors } from "lucide-react";
import { deleteQuoteAction, createQuoteAction, pruneQuotesAction, pruneAllQuotesAction } from "@/actions/admin";

interface QuoteRow {
  id: number;
  productName: string;
  productSlug: string;
  cityName: string;
  state: string;
  sourceName: string;
  price: number;
  variation: number | null;
  quoteDate: string;
}

interface FormOptions {
  allProducts: { id: number; name: string; slug: string }[];
  allCities: { id: number; name: string; state: string }[];
  allSources: { id: number; name: string }[];
}

interface Props {
  initialData: {
    rows: QuoteRow[];
    total: number;
    page: number;
    limit: number;
    allProducts: { slug: string; name: string }[];
  };
  formOptions: FormOptions;
  currentPage: number;
  currentProduct?: string;
}

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition w-full";

export default function QuotesManager({
  initialData,
  formOptions,
  currentPage,
  currentProduct,
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showPrune, setShowPrune] = useState(false);
  const [pruneDate, setPruneDate] = useState(new Date().toISOString().slice(0, 10));
  const [pruneResult, setPruneResult] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalPages = Math.ceil(initialData.total / initialData.limit);

  function handleDelete(id: number) {
    if (!confirm("Excluir esta cotação?")) return;
    startTransition(async () => {
      await deleteQuoteAction(id);
      router.refresh();
    });
  }

  async function handleCreate(formData: FormData) {
    setError("");
    startTransition(async () => {
      const result = await createQuoteAction(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  function handlePruneAll() {
    if (!confirm("Tem certeza? Isso vai apagar TODAS as cotações de TODAS as datas. Esta ação é irreversível.")) return;
    startTransition(async () => {
      const result = await pruneAllQuotesAction();
      setPruneResult(`${result.deleted ?? 0} cotações removidas (total).`);
      router.refresh();
    });
  }

  function handlePrune() {
    startTransition(async () => {
      const result = await pruneQuotesAction(pruneDate);
      if (result.error) {
        setPruneResult(`Erro: ${result.error}`);
      } else {
        setPruneResult(`${result.deleted ?? 0} cotações removidas.`);
        router.refresh();
      }
    });
  }

  function handleFilter(product: string) {
    const params = new URLSearchParams();
    if (product) params.set("product", product);
    router.push(`/admin/cotacoes?${params.toString()}`);
  }

  function handlePage(page: number) {
    const params = new URLSearchParams();
    if (currentProduct) params.set("product", currentProduct);
    params.set("page", String(page));
    router.push(`/admin/cotacoes?${params.toString()}`);
  }

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          <select
            value={currentProduct ?? ""}
            onChange={(e) => handleFilter(e.target.value)}
            className={`${inputClass} w-auto`}
          >
            <option value="">Todos os produtos</option>
            {initialData.allProducts.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => { setShowPrune(!showPrune); setShowForm(false); setPruneResult(null); }}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Scissors className="w-4 h-4" />
            Prune
          </button>
          <button
            type="button"
            onClick={() => { setShowForm(!showForm); setShowPrune(false); }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancelar" : "Nova Cotação"}
          </button>
        </div>
      </div>

      {/* Prune panel */}
      {showPrune && (
        <div className="bg-red-950/40 border border-red-500/20 rounded-2xl p-5 flex flex-col gap-4">
          <div>
            <h3 className="font-semibold text-red-300">Remover cotações por data</h3>
            <p className="text-xs text-white/50 mt-1">
              Apaga todas as cotações da data selecionada. Use para limpar um dia com dados incompletos antes de re-executar o scraping.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="pruneDate" className="text-xs text-white/60">Data</label>
              <input
                id="pruneDate"
                type="date"
                value={pruneDate}
                onChange={(e) => { setPruneDate(e.target.value); setPruneResult(null); }}
                className={inputClass}
              />
            </div>
            <button
              type="button"
              disabled={isPending}
              onClick={handlePrune}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2 rounded-lg transition-colors"
            >
              <Scissors className="w-4 h-4" />
              {isPending ? "Removendo…" : "Confirmar Prune"}
            </button>
          </div>
          <div className="border-t border-red-500/20 pt-4">
            <p className="text-xs text-white/50 mb-3">Ou apague o banco de cotações inteiro:</p>
            <button
              type="button"
              disabled={isPending}
              onClick={handlePruneAll}
              className="flex items-center gap-2 bg-red-900 hover:bg-red-800 disabled:opacity-60 text-red-300 font-semibold text-sm px-5 py-2 rounded-lg border border-red-500/30 transition-colors"
            >
              <Scissors className="w-4 h-4" />
              {isPending ? "Removendo…" : "Prune Total (todas as datas)"}
            </button>
          </div>
          {pruneResult && (
            <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">
              {pruneResult}
            </p>
          )}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form
          action={handleCreate}
          className="bg-white/5 border border-white/10 rounded-2xl p-5"
        >
          <h3 className="font-semibold mb-4">Inserir Cotação Manual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="productId" className="text-xs text-white/60">
                Produto *
              </label>
              <select
                id="productId"
                name="productId"
                required
                className={inputClass}
              >
                <option value="">Selecione</option>
                {formOptions.allProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="cityId" className="text-xs text-white/60">
                Cidade *
              </label>
              <select
                id="cityId"
                name="cityId"
                required
                className={inputClass}
              >
                <option value="">Selecione</option>
                {formOptions.allCities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.state} — {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="sourceId" className="text-xs text-white/60">
                Fonte *
              </label>
              <select name="sourceId" required className={inputClass}>
                <option value="">Selecione</option>
                {formOptions.allSources.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="price" className="text-xs text-white/60">
                Preço (R$) *
              </label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="variation" className="text-xs text-white/60">
                Variação (%)
              </label>
              <input
                id="variation"
                name="variation"
                type="number"
                step="0.01"
                placeholder="0.00"
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="quoteDate" className="text-xs text-white/60">
                Data *
              </label>
              <input
                id="quoteDate"
                name="quoteDate"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
                className={inputClass}
              />
            </div>
          </div>
          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="mt-4 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-2 rounded-lg transition-colors"
          >
            {isPending ? "Salvando…" : "Salvar Cotação"}
          </button>
        </form>
      )}

      {/* Table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Produto</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  Região
                </th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                  Fonte
                </th>
                <th className="text-right px-5 py-3 font-medium">Preço</th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">
                  Var.
                </th>
                <th className="text-right px-5 py-3 font-medium">Data</th>
                <th className="text-right px-5 py-3 font-medium w-12" />
              </tr>
            </thead>
            <tbody>
              {initialData.rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-white/30">
                    Nenhuma cotação encontrada
                  </td>
                </tr>
              ) : (
                initialData.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3 font-medium">{row.productName}</td>
                    <td className="px-5 py-3 text-white/60 hidden sm:table-cell">
                      {row.state} — {row.cityName}
                    </td>
                    <td className="px-5 py-3 text-white/60 hidden md:table-cell">
                      {row.sourceName}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      R$ {row.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right hidden sm:table-cell">
                      {row.variation !== null ? (
                        <span
                          className={`text-xs font-semibold ${
                            row.variation >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {row.variation >= 0 ? "+" : ""}
                          {row.variation.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-white/40 text-xs">
                      {row.quoteDate}
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDelete(row.id)}
                        disabled={isPending}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/30 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
            <p className="text-xs text-white/40">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handlePage(currentPage - 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => handlePage(currentPage + 1)}
                className="p-1.5 rounded-lg hover:bg-white/10 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
