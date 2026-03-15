"use client";

import { useState, useTransition } from "react";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import QuoteChart from "./QuoteChart";
import { getProductCityHistories } from "@/actions/quotes";
import type { QuoteRow, CityLine } from "@/actions/quotes";

interface Props {
  quotes: QuoteRow[];
  title: string;
}

function VariationBadge({ value }: { value: number | null }) {
  if (value === null) return <span className="text-white/30">—</span>;
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
        positive
          ? "bg-green-500/20 text-green-400"
          : "bg-red-500/20 text-red-400"
      }`}
    >
      {positive ? (
        <TrendingUp className="w-3 h-3" />
      ) : (
        <TrendingDown className="w-3 h-3" />
      )}
      {positive ? "+" : ""}
      {value.toFixed(2)}%
    </span>
  );
}

export default function CommoditiesTableClient({ quotes, title }: Props) {
  const [selected, setSelected] = useState<QuoteRow | null>(null);
  const [cityLines, setCityLines] = useState<CityLine[]>([]);
  const [isPending, startTransition] = useTransition();

  function handleRowClick(row: QuoteRow) {
    setSelected(row);
    startTransition(async () => {
      const data = await getProductCityHistories(row.productSlug);
      setCityLines(data);
    });
  }

  function closeModal() {
    setSelected(null);
    setCityLines([]);
  }

  return (
    <>
      <section className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-base">{title}</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Produto</th>
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Cidade</th>
                <th className="text-right px-5 py-3 font-medium">Preço</th>
                <th className="text-right px-5 py-3 font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {quotes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-white/30">
                    Sem cotações para hoje
                  </td>
                </tr>
              ) : (
                quotes.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    onClick={() => handleRowClick(row)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handleRowClick(row);
                    }}
                    className="border-t border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-3 font-medium">{row.productName}</td>
                    <td className="px-5 py-3 text-white/60">{row.state}</td>
                    <td className="px-5 py-3 text-white/60">{row.city}</td>
                    <td className="px-5 py-3 text-right font-semibold">
                      R$ {row.price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <VariationBadge value={row.variation} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* backdrop */}
          <button
            type="button"
            aria-label="Fechar"
            className="absolute inset-0 w-full h-full bg-black/60 backdrop-blur-sm cursor-default"
            onClick={closeModal}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={selected.productName}
            className="relative z-10 w-full max-w-2xl bg-[#1a2218] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-white/10">
              <div>
                <h3 className="font-semibold text-base">
                  {selected.productName}
                </h3>
                <p className="text-sm text-white/50 mt-0.5">
                  <span className="text-green-400 font-medium">
                    {selected.city} — {selected.state}
                  </span>
                  {" · "}
                  {selected.unit}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price highlight */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
              <div>
                <p className="text-xs text-white/40 mb-0.5">Última cotação</p>
                <p className="text-2xl font-bold">
                  R$ {selected.price.toFixed(2)}
                </p>
              </div>
              <VariationBadge value={selected.variation} />
            </div>

            {/* Chart */}
            <div className="px-4 pt-4 pb-6">
              <p className="text-xs text-white/40 px-2 mb-3">
                Últimos 30 dias — todas as praças
                {cityLines.length > 1 && (
                  <span className="ml-1 text-green-400/70">
                    (cidade em destaque: {selected.city}/{selected.state})
                  </span>
                )}
              </p>
              {isPending ? (
                <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                  Carregando…
                </div>
              ) : (
                <QuoteChart
                  lines={cityLines}
                  unit={selected.unit}
                  highlightCityId={selected.cityId}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

