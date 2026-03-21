"use client";

import { useState, useMemo, useTransition } from "react";
import {
  X,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import QuoteChart from "./QuoteChart";
import { getCityHistoryByRange } from "@/actions/quotes";
import type { QuoteRow, HistoryPoint } from "@/actions/quotes";

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

type SortKey = "productName" | "state" | "city" | "price" | "variation";
type SortDir = "asc" | "desc";

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active)
    return <ChevronsUpDown className="w-3 h-3 inline ml-1 opacity-40" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3 h-3 inline ml-1" />
  ) : (
    <ChevronDown className="w-3 h-3 inline ml-1" />
  );
}

export default function CommoditiesTableClient({ quotes, title }: Props) {
  const [selected, setSelected] = useState<QuoteRow | null>(null);
  const [historyData, setHistoryData] = useState<HistoryPoint[]>([]);
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const sorted = useMemo(() => {
    if (!sortKey) return quotes;
    const arr = [...quotes];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "productName":
          cmp = a.productName.localeCompare(b.productName);
          break;
        case "state":
          cmp = a.state.localeCompare(b.state);
          break;
        case "city":
          cmp = a.city.localeCompare(b.city);
          break;
        case "price":
          cmp = a.price - b.price;
          break;
        case "variation":
          cmp = (a.variation ?? -Infinity) - (b.variation ?? -Infinity);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [quotes, sortKey, sortDir]);

  function handleRowClick(row: QuoteRow) {
    setSelected(row);
    startTransition(async () => {
      const data = await getCityHistoryByRange(row.productSlug, row.cityId, 30);
      setHistoryData(data);
    });
  }

  function closeModal() {
    setSelected(null);
    setHistoryData([]);
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
                {(
                  [
                    ["productName", "Produto", "left"],
                    ["state", "Estado", "left"],
                    ["city", "Cidade", "left"],
                    ["price", "Preço", "right"],
                    ["variation", "Variação", "right"],
                  ] as const
                ).map(([key, label, align]) => (
                  <th
                    key={key}
                    className={`text-${align} px-2 md:px-5 py-3 font-medium cursor-pointer select-none hover:text-white/60 transition-colors`}
                    onClick={() => toggleSort(key)}
                  >
                    <div className="inline-flex items-center gap-0.5">
                      {label}
                      <SortIcon active={sortKey === key} dir={sortDir} />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-white/30">
                    Sem cotações para hoje
                  </td>
                </tr>
              ) : (
                sorted.map((row) => (
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
                    <td className="px-2 md:px-5 py-3 font-medium whitespace-nowrap">
                      {row.productName}
                    </td>
                    <td className="px-2 md:px-5 py-3 text-white/60 whitespace-nowrap">
                      {row.state}
                    </td>
                    <td className="px-2 md:px-5 py-3 text-white/60 min-w-0 whitespace-nowrap">
                      {row.city}
                    </td>
                    <td className="px-2 md:px-5 py-3 text-right font-semibold whitespace-nowrap">
                      R$ {row.price.toFixed(2)}
                    </td>
                    <td className="px-2 md:px-5 py-3 text-right whitespace-nowrap">
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
        <div className="fixed inset-0 z-50 flex items-stretch sm:items-center sm:justify-center">
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
            className="relative z-10 w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[85vh] overflow-y-auto bg-[#1a2218] sm:border sm:border-white/10 sm:rounded-2xl shadow-2xl sm:mx-4"
          >
            {/* Modal header */}
            <div className="flex items-start justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-white/10">
              <div className="min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">
                  {selected.productName}
                </h3>
                <p className="text-xs sm:text-sm text-white/50 mt-0.5">
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
                className="shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price highlight */}
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-white/10">
              <div>
                <p className="text-xs text-white/40 mb-0.5">Última cotação</p>
                <p className="text-xl sm:text-2xl font-bold">
                  R$ {selected.price.toFixed(2)}
                </p>
              </div>
              <VariationBadge value={selected.variation} />
            </div>

            {/* Chart */}
            <div className="px-2 sm:px-4 pt-3 sm:pt-4 pb-4 sm:pb-6">
              <p className="text-xs text-white/40 px-2 mb-3">
                Histórico de preços — {selected.city}/{selected.state}
              </p>
              {isPending ? (
                <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                  Carregando…
                </div>
              ) : (
                <QuoteChart
                  data={historyData}
                  unit={selected.unit}
                  color="#4ade80"
                  productSlug={selected.productSlug}
                  cityId={selected.cityId}
                  showRangeSelector
                  initialRange={30}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
