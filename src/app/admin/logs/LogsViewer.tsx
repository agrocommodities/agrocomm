"use client";

import { useState, useTransition } from "react";
import { getAuditLogs } from "@/actions/adminClassifieds";
import { UAParser } from "ua-parser-js";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  EyeOff,
  Monitor,
  Smartphone,
  Tablet,
} from "lucide-react";

interface LogRow {
  id: number;
  userId: number | null;
  action: string;
  target: string | null;
  details: string | null;
  originalText: string | null;
  replacedText: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  userName: string | null;
}

interface Data {
  items: LogRow[];
  total: number;
  page: number;
  totalPages: number;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login_success: { label: "Login", color: "text-green-400" },
  login_failed: { label: "Login falhou", color: "text-red-400" },
  classified_created: { label: "Anúncio criado", color: "text-blue-400" },
  classified_approved: { label: "Anúncio aprovado", color: "text-green-400" },
  classified_rejected: { label: "Anúncio rejeitado", color: "text-orange-400" },
  classified_blocked: { label: "Anúncio bloqueado", color: "text-red-400" },
  classified_deleted: { label: "Anúncio excluído", color: "text-red-400" },
  comment_created: { label: "Comentário", color: "text-blue-400" },
  comment_moderated: { label: "Moderação", color: "text-yellow-400" },
  comment_deleted: { label: "Comentário excluído", color: "text-red-400" },
  category_created: { label: "Categoria criada", color: "text-blue-400" },
  category_updated: { label: "Categoria editada", color: "text-yellow-400" },
  category_deleted: { label: "Categoria excluída", color: "text-red-400" },
  moderation_setting_updated: {
    label: "Config. moderação",
    color: "text-purple-400",
  },
  register: { label: "Cadastro", color: "text-blue-400" },
  logout: { label: "Logout", color: "text-white/50" },
};

const ACTION_FILTER = [
  { value: "all", label: "Todas as ações" },
  { value: "login_success", label: "Login bem-sucedido" },
  { value: "login_failed", label: "Login falho" },
  { value: "classified_created", label: "Anúncio criado" },
  { value: "classified_approved", label: "Anúncio aprovado" },
  { value: "classified_rejected", label: "Anúncio rejeitado" },
  { value: "classified_blocked", label: "Anúncio bloqueado" },
  { value: "classified_deleted", label: "Anúncio excluído" },
  { value: "comment_created", label: "Comentário criado" },
  { value: "comment_moderated", label: "Moderação" },
  { value: "comment_deleted", label: "Comentário excluído" },
  { value: "category_created", label: "Categoria criada" },
  { value: "moderation_setting_updated", label: "Config. moderação" },
];

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition";

function parseUA(uaString: string) {
  const parser = new UAParser(uaString);
  const result = parser.getResult();
  return {
    browser: result.browser.name
      ? `${result.browser.name}${result.browser.version ? ` ${result.browser.version.split(".")[0]}` : ""}`
      : null,
    os: result.os.name
      ? `${result.os.name}${result.os.version ? ` ${result.os.version}` : ""}`
      : null,
    device: result.device.type ?? "desktop",
    deviceModel:
      result.device.vendor && result.device.model
        ? `${result.device.vendor} ${result.device.model}`
        : null,
  };
}

function DeviceIcon({ type }: { type: string }) {
  if (type === "mobile")
    return <Smartphone className="w-3 h-3 text-white/40" />;
  if (type === "tablet") return <Tablet className="w-3 h-3 text-white/40" />;
  return <Monitor className="w-3 h-3 text-white/40" />;
}

export default function LogsViewer({ initialData }: { initialData: Data }) {
  const [data, setData] = useState(initialData);
  const [actionFilter, setActionFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [_isPending, startTransition] = useTransition();

  function refresh(opts?: { action?: string; search?: string; page?: number }) {
    startTransition(async () => {
      const d = await getAuditLogs({
        action: opts?.action ?? actionFilter,
        search: opts?.search ?? search,
        page: opts?.page ?? 1,
      });
      setData(d);
    });
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            refresh({ action: e.target.value });
          }}
          className={inputClass}
        >
          {ACTION_FILTER.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && refresh({ search })}
            placeholder="Buscar nos detalhes..."
            className={`${inputClass} pl-10 w-full`}
          />
        </div>
      </div>

      {/* Logs list */}
      <div className="flex flex-col gap-2">
        {data.items.map((log) => {
          const meta = ACTION_LABELS[log.action] ?? {
            label: log.action,
            color: "text-white/50",
          };
          const isExpanded = expanded === log.id;
          const uaParsed = log.userAgent ? parseUA(log.userAgent) : null;

          return (
            <div
              key={log.id}
              className="bg-white/3 border border-white/10 rounded-xl px-4 py-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className={`w-4 h-4 shrink-0 ${meta.color}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                      {log.userName && (
                        <span className="text-xs text-white/40">
                          por {log.userName}
                        </span>
                      )}
                      {log.target && (
                        <span className="text-[10px] text-white/30 bg-white/5 px-1.5 py-0.5 rounded">
                          {log.target}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-white/30 mt-0.5 flex items-center gap-1.5">
                      {formatDate(log.createdAt)}
                      {uaParsed && (
                        <>
                          <span className="text-white/20">·</span>
                          <DeviceIcon type={uaParsed.device} />
                          {log.ipAddress && <span>{log.ipAddress}</span>}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {(log.details ||
                  log.originalText ||
                  log.ipAddress ||
                  log.userAgent) && (
                  <button
                    type="button"
                    onClick={() => setExpanded(isExpanded ? null : log.id)}
                    className="shrink-0 p-1.5 hover:bg-white/10 rounded-lg transition"
                  >
                    {isExpanded ? (
                      <EyeOff className="w-4 h-4 text-white/40" />
                    ) : (
                      <Eye className="w-4 h-4 text-white/40" />
                    )}
                  </button>
                )}
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-white/5 text-xs space-y-2">
                  {log.originalText && (
                    <div>
                      <span className="text-white/40">Original:</span>{" "}
                      <code className="text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded">
                        {log.originalText}
                      </code>
                    </div>
                  )}
                  {log.replacedText && (
                    <div>
                      <span className="text-white/40">Substituído por:</span>{" "}
                      <code className="text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                        {log.replacedText}
                      </code>
                    </div>
                  )}
                  {log.details && (
                    <div>
                      <span className="text-white/40">Detalhes:</span>{" "}
                      <code className="text-white/60 bg-white/5 px-1.5 py-0.5 rounded break-all">
                        {log.details}
                      </code>
                    </div>
                  )}
                  {log.ipAddress && !log.userAgent && (
                    <div>
                      <span className="text-white/40">IP:</span>{" "}
                      <code className="text-white/60">{log.ipAddress}</code>
                    </div>
                  )}
                  {uaParsed && (
                    <div className="flex flex-col gap-1">
                      {log.ipAddress && (
                        <div>
                          <span className="text-white/40">IP:</span>{" "}
                          <code className="text-white/60">{log.ipAddress}</code>
                        </div>
                      )}
                      {uaParsed.browser && (
                        <div>
                          <span className="text-white/40">Navegador:</span>{" "}
                          <code className="text-white/60">
                            {uaParsed.browser}
                          </code>
                        </div>
                      )}
                      {uaParsed.os && (
                        <div>
                          <span className="text-white/40">Sistema:</span>{" "}
                          <code className="text-white/60">{uaParsed.os}</code>
                        </div>
                      )}
                      <div>
                        <span className="text-white/40">Dispositivo:</span>{" "}
                        <code className="text-white/60">
                          {uaParsed.deviceModel ??
                            (uaParsed.device === "mobile"
                              ? "Celular"
                              : uaParsed.device === "tablet"
                                ? "Tablet"
                                : "Desktop")}
                        </code>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {data.items.length === 0 && (
        <p className="text-center text-white/30 py-8">Nenhum log encontrado.</p>
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
