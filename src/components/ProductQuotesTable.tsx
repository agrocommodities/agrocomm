"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import type { QuoteRow } from "@/actions/quotes";

type SortKey = "state" | "city" | "price" | "variation";
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

interface Props {
  rows: QuoteRow[];
  productSlug: string;
}

export default function ProductQuotesTable({ rows, productSlug }: Props) {
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
    if (!sortKey) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
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
  }, [rows, sortKey, sortDir]);

  const headers = [
    ["state", "Estado", "left"],
    ["city", "Cidade", "left"],
    ["price", "Preço", "right"],
    ["variation", "Variação", "right"],
  ] as const;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10">
        <h2 className="font-semibold text-base">Cotações de hoje por praça</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/40 text-xs uppercase tracking-wide">
              {headers.map(([key, label, align]) => (
                <th
                  key={key}
                  className={`text-${align} px-5 py-3 font-medium cursor-pointer select-none hover:text-white/60 transition-colors`}
                  onClick={() => toggleSort(key)}
                >
                  {label}
                  <SortIcon active={sortKey === key} dir={sortDir} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-10 text-white/30">
                  Sem cotações para hoje
                </td>
              </tr>
            ) : (
              sorted.map((row) => (
                <tr
                  key={row.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3 text-white/60">
                    <Link
                      href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${productSlug}`}
                      className="hover:text-green-400 transition-colors"
                    >
                      {row.state}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-white/60">
                    <Link
                      href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${productSlug}`}
                      className="hover:text-green-400 transition-colors"
                    >
                      {row.city}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold">
                    <Link
                      href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${productSlug}`}
                      className="hover:text-green-400 transition-colors"
                    >
                      R$ {row.price.toFixed(2)}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${productSlug}`}
                      className="hover:text-green-400 transition-colors"
                    >
                      {row.variation !== null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                            row.variation >= 0
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {row.variation >= 0 ? "+" : ""}
                          {row.variation.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
