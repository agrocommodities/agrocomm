"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RefreshCw,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Newspaper,
} from "lucide-react";
import {
  deleteNewsAction,
  pruneAllNewsAction,
  toggleNewsSourceAction,
} from "@/actions/admin";

interface NewsRow {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  imageUrl: string | null;
  sourceUrl: string;
  sourceName: string;
  category: string;
  publishedAt: string;
  createdAt: string;
}

interface NewsSource {
  id: number;
  slug: string;
  name: string;
  url: string;
  category: string;
  active: number;
}

interface ScrapeResult {
  status: string;
  inserted: number;
  error?: string;
}

const CATEGORIES = [
  { slug: "", label: "Todas" },
  { slug: "graos", label: "Grãos" },
  { slug: "pecuaria", label: "Pecuária" },
  { slug: "clima", label: "Clima" },
  { slug: "geral", label: "Geral" },
];

const categoryColors: Record<string, string> = {
  graos: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  pecuaria: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  clima: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  geral: "bg-white/5 text-white/50 border-white/10",
};

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

export default function NewsManager({
  initialData,
  currentPage,
  currentCategory,
  initialSources,
}: {
  initialData: {
    rows: NewsRow[];
    total: number;
    page: number;
    limit: number;
  };
  currentPage: number;
  currentCategory?: string;
  initialSources: NewsSource[];
}) {
  const [scraping, setScraping] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalPages = Math.ceil(initialData.total / initialData.limit);

  async function runScrape() {
    setScraping(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/scrape-news", { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setResult({ status: "error", inserted: 0, error: data.error });
      } else {
        setResult(data.result);
      }
      router.refresh();
    } catch (err) {
      setResult({
        status: "error",
        inserted: 0,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      setScraping(false);
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Excluir esta notícia?")) return;
    startTransition(async () => {
      await deleteNewsAction(id);
      router.refresh();
    });
  }

  function handlePruneAll() {
    if (
      !confirm(
        "Tem certeza? Isso vai apagar TODAS as notícias. Esta ação é irreversível.",
      )
    )
      return;
    startTransition(async () => {
      await pruneAllNewsAction();
      router.refresh();
    });
  }

  function handleFilter(category: string) {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    router.push(`/admin/noticias${params.toString() ? `?${params}` : ""}`);
  }

  function handleToggleSource(id: number, currentActive: number) {
    startTransition(async () => {
      await toggleNewsSourceAction(id, currentActive === 0);
      router.refresh();
    });
  }

  function goToPage(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (currentCategory) params.set("categoria", currentCategory);
    router.push(`/admin/noticias${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={scraping}
          onClick={runScrape}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {scraping ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {scraping ? "Coletando…" : "Coletar Notícias"}
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={handlePruneAll}
          className="flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold text-sm px-5 py-2.5 rounded-lg border border-red-500/20 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Limpar Todas
        </button>
      </div>

      {/* Scrape result */}
      {result && (
        <div
          className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
            result.status === "success"
              ? "bg-green-500/10 border border-green-500/20"
              : "bg-red-500/10 border border-red-500/20"
          }`}
        >
          {result.status === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
          ) : (
            <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-medium">
              {result.status === "success"
                ? `${result.inserted} notícias coletadas`
                : "Erro na coleta"}
            </p>
            {result.error && (
              <p className="text-xs text-red-300 mt-0.5">{result.error}</p>
            )}
          </div>
        </div>
      )}

      {/* News Sources */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Fontes de Notícias</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Fonte</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  URL
                </th>
                <th className="text-center px-5 py-3 font-medium">Categoria</th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {initialSources.map((src) => (
                <tr
                  key={src.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-5 py-3 font-medium">{src.name}</td>
                  <td className="px-5 py-3 text-white/40 hidden sm:table-cell">
                    <a
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white/60"
                    >
                      <span className="truncate max-w-48">
                        {src.url.replace(/^https?:\/\//, "")}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[src.category] ?? categoryColors.geral}`}
                    >
                      {src.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${src.active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}
                    >
                      {src.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggleSource(src.id, src.active)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${src.active ? "bg-red-500/10 text-red-400 hover:bg-red-500/20" : "bg-green-500/10 text-green-400 hover:bg-green-500/20"}`}
                    >
                      {src.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.slug}
            type="button"
            onClick={() => handleFilter(c.slug)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
              (currentCategory ?? "") === c.slug
                ? "bg-green-600/20 text-green-400 border-green-500/30"
                : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="text-sm text-white/40">
        {initialData.total} notícias no total
      </div>

      {/* Table */}
      {initialData.rows.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
          <Newspaper className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">Nenhuma notícia encontrada</p>
        </div>
      ) : (
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Título</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">
                    Categoria
                  </th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">
                    Data
                  </th>
                  <th className="text-left px-4 py-3 hidden lg:table-cell">
                    Fonte
                  </th>
                  <th className="text-right px-4 py-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {initialData.rows.map((article) => (
                  <tr
                    key={article.id}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium line-clamp-2 max-w-xs lg:max-w-md">
                        {article.title}
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span
                        className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[article.category] ?? categoryColors.geral}`}
                      >
                        {article.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/50 hidden sm:table-cell whitespace-nowrap">
                      {formatDate(article.publishedAt)}
                    </td>
                    <td className="px-4 py-3 text-white/40 hidden lg:table-cell">
                      {article.sourceName}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={article.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-white/10 hover:text-white transition-colors"
                          title="Ver original"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleDelete(article.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => goToPage(currentPage - 1)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/50">
            {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => goToPage(currentPage + 1)}
            className="p-2 rounded-lg bg-white/5 border border-white/10 disabled:opacity-30 hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
