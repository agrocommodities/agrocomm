"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  AlertTriangle,
  CheckCircle2,
  ArrowRightLeft,
} from "lucide-react";
import { acceptConflictAction, dismissConflictAction } from "@/actions/admin";

interface Conflict {
  id: number;
  quoteId: number;
  productName: string;
  cityName: string;
  stateCode: string;
  quoteDate: string;
  keptSourceName: string;
  keptPrice: number;
  rejectedSourceName: string;
  rejectedPrice: number;
  status: string;
  createdAt: string;
}

type Filter = "all" | "pending" | "resolved";

export default function ConflictsManager({
  initialConflicts,
}: {
  initialConflicts: Conflict[];
}) {
  const [filter, setFilter] = useState<Filter>("pending");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = initialConflicts.filter((c) => {
    if (filter === "pending") return c.status === "pending";
    if (filter === "resolved") return c.status !== "pending";
    return true;
  });

  const pendingCount = initialConflicts.filter(
    (c) => c.status === "pending",
  ).length;

  function handleAccept(id: number) {
    startTransition(async () => {
      await acceptConflictAction(id);
      router.refresh();
    });
  }

  function handleDismiss(id: number) {
    startTransition(async () => {
      await dismissConflictAction(id);
      router.refresh();
    });
  }

  function formatPrice(price: number) {
    return price.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  }

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white/5 rounded-xl border border-white/10 p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider">
            Total
          </p>
          <p className="text-2xl font-bold mt-1">
            {initialConflicts.length}
          </p>
        </div>
        <div className="bg-yellow-500/10 rounded-xl border border-yellow-500/20 p-4">
          <p className="text-xs text-yellow-400/70 uppercase tracking-wider">
            Pendentes
          </p>
          <p className="text-2xl font-bold text-yellow-400 mt-1">
            {pendingCount}
          </p>
        </div>
        <div className="bg-green-500/10 rounded-xl border border-green-500/20 p-4">
          <p className="text-xs text-green-400/70 uppercase tracking-wider">
            Resolvidos
          </p>
          <p className="text-2xl font-bold text-green-400 mt-1">
            {initialConflicts.length - pendingCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(
          [
            ["all", "Todos"],
            ["pending", "Pendentes"],
            ["resolved", "Resolvidos"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${
                filter === key
                  ? "bg-green-600/20 text-green-400 border border-green-500/30"
                  : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10 hover:text-white"
              }`}
          >
            {label}
            {key === "pending" && pendingCount > 0 && (
              <span className="ml-1.5 bg-yellow-500/20 text-yellow-400 text-xs px-1.5 py-0.5 rounded-full">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
          <CheckCircle2 className="w-10 h-10 text-green-400/50 mx-auto mb-3" />
          <p className="text-white/50">
            {filter === "pending"
              ? "Nenhum conflito pendente"
              : "Nenhum conflito encontrado"}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white/5 rounded-xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-white/40 text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Data</th>
                    <th className="text-left px-4 py-3">Produto</th>
                    <th className="text-left px-4 py-3">Cidade/UF</th>
                    <th className="text-left px-4 py-3">Preço Mantido</th>
                    <th className="text-left px-4 py-3">Preço Alternativo</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="px-4 py-3 text-white/60">
                        {formatDate(c.quoteDate)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {c.productName}
                      </td>
                      <td className="px-4 py-3">
                        {c.cityName}{" "}
                        <span className="text-white/40">- {c.stateCode}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-green-400 font-medium">
                            {formatPrice(c.keptPrice)}
                          </span>
                          <span className="text-xs text-white/30">
                            {c.keptSourceName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col">
                          <span className="text-yellow-400 font-medium">
                            {formatPrice(c.rejectedPrice)}
                          </span>
                          <span className="text-xs text-white/30">
                            {c.rejectedSourceName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        {c.status === "pending" && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleAccept(c.id)}
                              title="Usar preço alternativo"
                              className="p-2 rounded-lg bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={isPending}
                              onClick={() => handleDismiss(c.id)}
                              title="Manter preço atual"
                              className="p-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden flex flex-col gap-3">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="bg-white/5 rounded-xl border border-white/10 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-medium">{c.productName}</p>
                    <p className="text-sm text-white/50">
                      {c.cityName} - {c.stateCode}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {formatDate(c.quoteDate)}
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/10">
                    <p className="text-xs text-white/40 mb-1">Mantido</p>
                    <p className="text-green-400 font-semibold">
                      {formatPrice(c.keptPrice)}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {c.keptSourceName}
                    </p>
                  </div>
                  <div className="bg-yellow-500/5 rounded-lg p-3 border border-yellow-500/10">
                    <p className="text-xs text-white/40 mb-1">Alternativo</p>
                    <p className="text-yellow-400 font-semibold">
                      {formatPrice(c.rejectedPrice)}
                    </p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {c.rejectedSourceName}
                    </p>
                  </div>
                </div>

                {c.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleAccept(c.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-yellow-500/10 text-yellow-400 text-sm font-medium hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
                    >
                      <ArrowRightLeft className="w-4 h-4" />
                      Trocar
                    </button>
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => handleDismiss(c.id)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 text-green-400 text-sm font-medium hover:bg-green-500/20 transition-colors disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      Manter
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
        <AlertTriangle className="w-3 h-3" />
        Pendente
      </span>
    );
  }
  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
        <ArrowRightLeft className="w-3 h-3" />
        Trocado
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
      <CheckCircle2 className="w-3 h-3" />
      Mantido
    </span>
  );
}
