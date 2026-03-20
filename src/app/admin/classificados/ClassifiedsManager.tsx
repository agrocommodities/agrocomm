"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getAdminClassifieds,
  approveClassified,
  rejectClassified,
  blockClassified,
  deleteClassified,
} from "@/actions/adminClassifieds";
import {
  Search,
  Check,
  X,
  Ban,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface ClassifiedRow {
  id: number;
  title: string;
  slug: string;
  price: number;
  status: string;
  createdAt: string;
  userName: string;
  categoryName: string;
  stateName: string;
  stateCode: string;
  cityName: string;
}

interface Data {
  items: ClassifiedRow[];
  total: number;
  page: number;
  totalPages: number;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400",
  approved: "bg-green-500/10 text-green-400",
  rejected: "bg-red-500/10 text-red-400",
  blocked: "bg-red-500/10 text-red-300",
};

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  blocked: "Bloqueado",
};

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

export default function ClassifiedsManager({
  initialData,
}: {
  initialData: Data;
}) {
  const [data, setData] = useState(initialData);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [_isPending, startTransition] = useTransition();
  const _router = useRouter();

  function refresh(opts?: { status?: string; search?: string; page?: number }) {
    startTransition(async () => {
      const d = await getAdminClassifieds({
        status: opts?.status ?? status,
        search: opts?.search ?? search,
        page: opts?.page ?? 1,
      });
      setData(d);
    });
  }

  function handleAction(
    action: (id: number) => Promise<{ success?: boolean; error?: string }>,
    id: number,
    label: string,
  ) {
    if (!confirm(`${label}?`)) return;
    startTransition(async () => {
      const result = await action(id);
      if (result.error) alert(result.error);
      refresh();
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refresh({ search: search })}
            placeholder="Buscar por título..."
            className={`${inputClass} pl-10 w-full`}
          />
        </div>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            refresh({ status: e.target.value });
          }}
          className={inputClass}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
          <option value="rejected">Rejeitados</option>
          <option value="blocked">Bloqueados</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/40 border-b border-white/10">
              <th className="pb-3 font-medium">Anúncio</th>
              <th className="pb-3 font-medium hidden sm:table-cell">
                Categoria
              </th>
              <th className="pb-3 font-medium hidden md:table-cell">Local</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.items.map((item) => (
              <tr key={item.id} className="hover:bg-white/3">
                <td className="py-3 pr-3">
                  <div className="font-medium text-sm line-clamp-1">
                    {item.title}
                  </div>
                  <div className="text-xs text-white/40">
                    {item.userName} · R$ {item.price.toLocaleString("pt-BR")}
                  </div>
                </td>
                <td className="py-3 pr-3 hidden sm:table-cell text-white/60">
                  {item.categoryName}
                </td>
                <td className="py-3 pr-3 hidden md:table-cell text-white/60 text-xs">
                  {item.cityName}, {item.stateCode}
                </td>
                <td className="py-3 pr-3">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColors[item.status] ?? ""}`}
                  >
                    {statusLabels[item.status] ?? item.status}
                  </span>
                </td>
                <td className="py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <a
                      href={`/classificados/${item.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 hover:bg-white/10 rounded-lg transition"
                      title="Ver"
                    >
                      <Eye className="w-4 h-4 text-white/50" />
                    </a>
                    {item.status === "pending" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            approveClassified,
                            item.id,
                            "Aprovar anúncio",
                          )
                        }
                        className="p-1.5 hover:bg-green-500/20 rounded-lg transition"
                        title="Aprovar"
                      >
                        <Check className="w-4 h-4 text-green-400" />
                      </button>
                    )}
                    {(item.status === "pending" ||
                      item.status === "approved") && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            rejectClassified,
                            item.id,
                            "Rejeitar anúncio",
                          )
                        }
                        className="p-1.5 hover:bg-orange-500/20 rounded-lg transition"
                        title="Rejeitar"
                      >
                        <X className="w-4 h-4 text-orange-400" />
                      </button>
                    )}
                    {item.status !== "blocked" && (
                      <button
                        type="button"
                        onClick={() =>
                          handleAction(
                            blockClassified,
                            item.id,
                            "Bloquear anúncio",
                          )
                        }
                        className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                        title="Bloquear"
                      >
                        <Ban className="w-4 h-4 text-red-400" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() =>
                        handleAction(
                          deleteClassified,
                          item.id,
                          "Excluir anúncio permanentemente",
                        )
                      }
                      className="p-1.5 hover:bg-red-500/20 rounded-lg transition"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data.items.length === 0 && (
        <p className="text-center text-white/30 py-8">
          Nenhum anúncio encontrado.
        </p>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            type="button"
            disabled={data.page <= 1}
            onClick={() => refresh({ page: data.page - 1 })}
            className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-white/50">
            {data.page} / {data.totalPages}
          </span>
          <button
            type="button"
            disabled={data.page >= data.totalPages}
            onClick={() => refresh({ page: data.page + 1 })}
            className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 disabled:opacity-30 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
