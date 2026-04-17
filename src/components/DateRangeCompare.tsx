"use client";

import { useState, useTransition } from "react";
import { CalendarRange, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getQuotesByDateRange } from "@/actions/quotes";
import type { QuoteRow } from "@/actions/quotes";

interface Props {
  productSlug: string;
  hasActivePlan: boolean;
  historyDays: number;
}

export default function DateRangeCompare({
  productSlug,
  hasActivePlan,
  historyDays,
}: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [startQuotes, setStartQuotes] = useState<QuoteRow[]>([]);
  const [endQuotes, setEndQuotes] = useState<QuoteRow[]>([]);
  const [isPending, startTransition] = useTransition();
  const [compared, setCompared] = useState(false);

  if (!hasActivePlan) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-white/30" />
          <div>
            <p className="text-sm font-medium text-white/60">
              Comparar preços por período
            </p>
            <p className="text-xs text-white/30">Disponível para assinantes</p>
          </div>
        </div>
        <Link
          href="/planos"
          className="text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-1"
        >
          Assinar
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - historyDays);
  const minDateStr = minDate.toISOString().slice(0, 10);
  const todayStr = new Date().toISOString().slice(0, 10);

  function handleCompare() {
    if (!startDate || !endDate) return;
    setCompared(true);
    startTransition(async () => {
      const [sQuotes, eQuotes] = await Promise.all([
        getQuotesByDateRange(productSlug, startDate, startDate),
        getQuotesByDateRange(productSlug, endDate, endDate),
      ]);
      setStartQuotes(sQuotes);
      setEndQuotes(eQuotes);
    });
  }

  // Build comparison data: match by cityId
  const comparisonRows = compared
    ? endQuotes.map((endRow) => {
        const startRow = startQuotes.find((s) => s.cityId === endRow.cityId);
        const startPrice = startRow?.price ?? null;
        const diff = startPrice !== null ? endRow.price - startPrice : null;
        const diffPercent =
          startPrice !== null && startPrice !== 0
            ? ((endRow.price - startPrice) / startPrice) * 100
            : null;
        return {
          ...endRow,
          startPrice,
          diff,
          diffPercent,
        };
      })
    : [];

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <CalendarRange className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <p className="text-sm font-medium text-white/70">
            Comparar preços por período
          </p>
          <p className="text-xs text-white/30">
            Selecione duas datas para comparar (últimos {historyDays} dias)
          </p>
        </div>
      </div>

      <div className="flex items-end gap-3 flex-wrap">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/40">Data inicial</span>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            min={minDateStr}
            max={todayStr}
            className="bg-[#2a3925] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs text-white/40">Data final</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || minDateStr}
            max={todayStr}
            className="bg-[#2a3925] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </label>
        <button
          type="button"
          onClick={handleCompare}
          disabled={!startDate || !endDate || isPending}
          className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-1.5 text-sm transition-colors cursor-pointer disabled:cursor-not-allowed"
        >
          {isPending ? "Comparando..." : "Comparar"}
        </button>
      </div>

      {/* Results table */}
      {compared && !isPending && comparisonRows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm mt-2">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-3 py-2 font-medium">Estado</th>
                <th className="text-left px-3 py-2 font-medium">Cidade</th>
                <th className="text-right px-3 py-2 font-medium">
                  {new Date(`${startDate}T12:00:00`).toLocaleDateString(
                    "pt-BR",
                    { day: "2-digit", month: "2-digit" },
                  )}
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  {new Date(`${endDate}T12:00:00`).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </th>
                <th className="text-right px-3 py-2 font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-3 py-2 text-white/60">{row.state}</td>
                  <td className="px-3 py-2 text-white/60">{row.city}</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {row.startPrice !== null
                      ? `R$ ${row.startPrice.toFixed(2)}`
                      : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">
                    R$ {row.price.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.diffPercent !== null ? (
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          row.diffPercent >= 0
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {row.diffPercent >= 0 ? "+" : ""}
                        {row.diffPercent.toFixed(2)}%
                      </span>
                    ) : (
                      <span className="text-white/30">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {compared && !isPending && comparisonRows.length === 0 && (
        <p className="text-sm text-white/30 text-center py-4">
          Sem dados para comparar nestas datas.
        </p>
      )}
    </div>
  );
}
