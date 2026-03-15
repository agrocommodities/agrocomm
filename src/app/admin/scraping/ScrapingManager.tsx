"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { toggleSourceAction } from "@/actions/admin";

interface Source {
  id: number;
  name: string;
  slug: string;
  url: string;
  priority: number;
  active: number;
}

interface Log {
  id: number;
  status: string;
  quotesInserted: number | null;
  errorMessage: string | null;
  executedAt: string;
  sourceName: string | null;
}

interface ScrapeResult {
  source: string;
  status: string;
  quotesInserted: number;
  error?: string;
}

export default function ScrapingManager({
  initialSources,
  initialLogs,
}: {
  initialSources: Source[];
  initialLogs: Log[];
}) {
  const [scraping, setScraping] = useState(false);
  const [results, setResults] = useState<ScrapeResult[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function runScrape(force: boolean) {
    setScraping(true);
    setResults(null);
    try {
      const res = await fetch("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force }),
      });
      const data = await res.json();
      if (data.error) {
        setResults([
          {
            source: "Sistema",
            status: "error",
            quotesInserted: 0,
            error: data.error,
          },
        ]);
      } else {
        setResults(data.results);
      }
      router.refresh();
    } catch (err) {
      setResults([
        {
          source: "Sistema",
          status: "error",
          quotesInserted: 0,
          error: err instanceof Error ? err.message : "Erro desconhecido",
        },
      ]);
    } finally {
      setScraping(false);
    }
  }

  function handleToggle(sourceId: number, currentActive: number) {
    startTransition(async () => {
      await toggleSourceAction(sourceId, currentActive === 0);
      router.refresh();
    });
  }

  return (
    <>
      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          disabled={scraping}
          onClick={() => runScrape(false)}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          {scraping ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          {scraping ? "Executando…" : "Executar Scraping"}
        </button>
        <button
          type="button"
          disabled={scraping}
          onClick={() => runScrape(true)}
          className="flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-60 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          Forçar (ignorar feriado/fim de semana)
        </button>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h3 className="font-semibold mb-3">Resultado da Execução</h3>
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={`${r.source}-${r.status}`}
                className={`flex items-start gap-3 px-4 py-3 rounded-lg ${
                  r.status === "success"
                    ? "bg-green-500/10 border border-green-500/20"
                    : r.status === "skipped"
                      ? "bg-yellow-500/10 border border-yellow-500/20"
                      : "bg-red-500/10 border border-red-500/20"
                }`}
              >
                {r.status === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                ) : r.status === "skipped" ? (
                  <AlertCircle className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="text-sm font-medium">{r.source}</p>
                  {r.status === "success" && (
                    <p className="text-xs text-white/50">
                      {r.quotesInserted} cotações processadas
                    </p>
                  )}
                  {r.status === "skipped" && (
                    <p className="text-xs text-white/50">
                      Ignorado — fim de semana ou feriado
                    </p>
                  )}
                  {r.error && (
                    <p className="text-xs text-red-300 mt-0.5">{r.error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Fontes de Dados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Fonte</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  URL
                </th>
                <th className="text-center px-5 py-3 font-medium">
                  Prioridade
                </th>
                <th className="text-center px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Ação</th>
              </tr>
            </thead>
            <tbody>
              {initialSources.map((source) => (
                <tr
                  key={source.id}
                  className="border-t border-white/5 hover:bg-white/5"
                >
                  <td className="px-5 py-3 font-medium">{source.name}</td>
                  <td className="px-5 py-3 text-white/40 hidden sm:table-cell">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 hover:text-white/60"
                    >
                      <span className="truncate max-w-48">
                        {source.url.replace(/^https?:\/\//, "")}
                      </span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </td>
                  <td className="px-5 py-3 text-center text-white/60">
                    {source.priority}
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span
                      className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                        source.active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {source.active ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleToggle(source.id, source.active)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        source.active
                          ? "bg-red-500/10 text-red-400 hover:bg-red-500/20"
                          : "bg-green-500/10 text-green-400 hover:bg-green-500/20"
                      }`}
                    >
                      {source.active ? "Desativar" : "Ativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold">Histórico de Execuções</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Fonte</th>
                <th className="text-left px-5 py-3 font-medium">Status</th>
                <th className="text-right px-5 py-3 font-medium">Cotações</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  Erro
                </th>
                <th className="text-right px-5 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {initialLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-white/30">
                    Nenhuma execução registrada
                  </td>
                </tr>
              ) : (
                initialLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3">{log.sourceName ?? "Sistema"}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                          log.status === "success"
                            ? "bg-green-500/20 text-green-400"
                            : log.status === "error"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-yellow-500/20 text-yellow-400"
                        }`}
                      >
                        {log.status === "success"
                          ? "Sucesso"
                          : log.status === "error"
                            ? "Erro"
                            : "Ignorado"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right text-white/60">
                      {log.quotesInserted}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs hidden sm:table-cell max-w-48 truncate">
                      {log.errorMessage ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-right text-white/40 text-xs whitespace-nowrap">
                      {log.executedAt}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
