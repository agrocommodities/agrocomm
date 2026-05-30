"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  HardDrive,
  Trash2,
  Search,
  ArrowUpDown,
  FolderX,
  ImageOff,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Download,
  Upload,
} from "lucide-react";
import type { StorageData, OrphanMedia } from "@/actions/admin";
import {
  deleteEmptyImageDirs,
  detectOrphanMedia,
  deleteOrphanMedia,
} from "@/actions/admin";

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / k ** i).toFixed(i > 0 ? 1 : 0)} ${sizes[i]}`;
}

type SortKey = "date-desc" | "date-asc" | "size-desc" | "size-asc";

export default function StorageManager({ data }: { data: StorageData }) {
  const router = useRouter();
  const { disk, posts } = data;
  const [sortKey, setSortKey] = useState<SortKey>("date-desc");
  const [deletingEmpty, setDeletingEmpty] = useState(false);
  const [emptyResult, setEmptyResult] = useState<string | null>(null);
  const [detectingOrphans, setDetectingOrphans] = useState(false);
  const [orphans, setOrphans] = useState<OrphanMedia[] | null>(null);
  const [deletingOrphans, setDeletingOrphans] = useState(false);
  const [orphanResult, setOrphanResult] = useState<string | null>(null);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupError, setBackupError] = useState<string | null>(null);
  const [restoringBackup, setRestoringBackup] = useState(false);
  const [restoreResult, setRestoreResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const usedPercent = (disk.used / disk.total) * 100;

  const sortedPosts = useMemo(() => {
    const copy = [...posts];
    switch (sortKey) {
      case "date-desc":
        return copy.sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime(),
        );
      case "date-asc":
        return copy.sort(
          (a, b) =>
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime(),
        );
      case "size-desc":
        return copy.sort((a, b) => b.mediaSize - a.mediaSize);
      case "size-asc":
        return copy.sort((a, b) => a.mediaSize - b.mediaSize);
    }
  }, [posts, sortKey]);

  const totalMediaSize = posts.reduce((acc, p) => acc + p.mediaSize, 0);

  async function handleDeleteEmpty() {
    setDeletingEmpty(true);
    setEmptyResult(null);
    try {
      const result = await deleteEmptyImageDirs();
      setEmptyResult(
        result.deleted > 0
          ? `${result.deleted} pasta(s) vazia(s) removida(s).`
          : "Nenhuma pasta vazia encontrada.",
      );
      if (result.deleted > 0) router.refresh();
    } catch {
      setEmptyResult("Erro ao remover pastas vazias.");
    } finally {
      setDeletingEmpty(false);
    }
  }

  async function handleDownloadBackup() {
    setDownloadingBackup(true);
    setBackupError(null);
    try {
      const res = await fetch("/api/admin/backup");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match?.[1] ?? "agrocomm-backup.zip";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setBackupError(
        err instanceof Error ? err.message : "Erro ao gerar backup.",
      );
    } finally {
      setDownloadingBackup(false);
    }
  }

  async function handleRestoreBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setRestoringBackup(true);
    setRestoreResult(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/admin/restore", {
        method: "POST",
        body: form,
      });
      const body = (await res.json()) as {
        ok?: boolean;
        message?: string;
        error?: string;
      };
      if (!res.ok) throw new Error(body.error ?? `HTTP ${res.status}`);
      setRestoreResult({
        ok: true,
        message: body.message ?? "Restaurado com sucesso.",
      });
      router.refresh();
    } catch (err) {
      setRestoreResult({
        ok: false,
        message:
          err instanceof Error ? err.message : "Erro ao restaurar backup.",
      });
    } finally {
      setRestoringBackup(false);
    }
  }

  async function handleDetectOrphans() {
    setDetectingOrphans(true);
    setOrphans(null);
    setOrphanResult(null);
    try {
      const result = await detectOrphanMedia();
      setOrphans(result);
      if (result.length === 0) {
        setOrphanResult("Nenhuma mídia órfã encontrada.");
      }
    } catch {
      setOrphanResult("Erro ao detectar mídias órfãs.");
    } finally {
      setDetectingOrphans(false);
    }
  }

  async function handleDeleteOrphans() {
    if (!orphans || orphans.length === 0) return;
    setDeletingOrphans(true);
    try {
      const result = await deleteOrphanMedia(
        orphans.map((o) => o.relativePath),
      );
      setOrphanResult(`${result.deleted} mídia(s) órfã(s) removida(s).`);
      setOrphans(null);
      router.refresh();
    } catch {
      setOrphanResult("Erro ao remover mídias órfãs.");
    } finally {
      setDeletingOrphans(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Disk Usage Card */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-blue-500/10 p-2 rounded-lg">
            <HardDrive className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h2 className="font-semibold">Uso do Disco</h2>
            <p className="text-xs text-white/40">Armazenamento da VPS</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-white/10 rounded-full h-4 mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              usedPercent > 90
                ? "bg-red-500"
                : usedPercent > 70
                  ? "bg-yellow-500"
                  : "bg-green-500"
            }`}
            style={{ width: `${Math.min(usedPercent, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm text-white/60">
          <span>
            Usado:{" "}
            <strong className="text-white">{formatBytes(disk.used)}</strong>
          </span>
          <span>
            Livre:{" "}
            <strong className="text-white">
              {formatBytes(disk.available)}
            </strong>
          </span>
          <span>
            Total:{" "}
            <strong className="text-white">{formatBytes(disk.total)}</strong>
          </span>
        </div>
        <p className="text-xs text-white/40 mt-2">
          {usedPercent.toFixed(1)}% em uso — Mídias dos posts:{" "}
          <strong className="text-white/70">
            {formatBytes(totalMediaSize)}
          </strong>
        </p>
      </div>

      {/* Backup */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-green-500/10 p-2 rounded-lg">
            <Download className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <h2 className="font-semibold">Backup</h2>
            <p className="text-xs text-white/40">
              Banco de dados + mídias enviadas pelos usuários
            </p>
          </div>
        </div>
        <p className="text-xs text-white/50 mb-4">
          Gera um arquivo <code className="text-white/70">.zip</code> contendo{" "}
          <strong className="text-white/70">database/agrocomm.db</strong> e as
          pastas{" "}
          <strong className="text-white/70">
            media/avatars, media/classifieds, media/posts
          </strong>
          .
        </p>
        <button
          type="button"
          onClick={handleDownloadBackup}
          disabled={downloadingBackup}
          className="px-5 py-2.5 bg-green-600/20 text-green-400 rounded-lg text-sm font-medium hover:bg-green-600/30 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {downloadingBackup ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Gerando backup…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Baixar Backup Completo
            </>
          )}
        </button>
        {backupError && (
          <p className="text-xs text-red-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {backupError}
          </p>
        )}

        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 mb-3">
            Restaurar a partir de um arquivo{" "}
            <code className="text-white/70">.zip</code> gerado por este painel.
            O banco de dados atual será copiado para{" "}
            <code className="text-white/70">drizzle/backups/</code> antes da
            restauração.
          </p>
          <label
            className={`inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600/20 text-orange-400 rounded-lg text-sm font-medium hover:bg-orange-600/30 transition-colors cursor-pointer ${
              restoringBackup ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {restoringBackup ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Restaurando…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Restaurar Backup
              </>
            )}
            <input
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleRestoreBackup}
              disabled={restoringBackup}
            />
          </label>
          {restoreResult && (
            <p
              className={`text-xs mt-2 flex items-center gap-1 ${
                restoreResult.ok ? "text-green-400" : "text-red-400"
              }`}
            >
              {restoreResult.ok ? (
                <CheckCircle className="w-3 h-3" />
              ) : (
                <AlertTriangle className="w-3 h-3" />
              )}
              {restoreResult.message}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Delete empty dirs */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-yellow-500/10 p-2 rounded-lg">
              <FolderX className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Pastas Vazias</h3>
              <p className="text-xs text-white/40">Em public/images/posts/</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDeleteEmpty}
            disabled={deletingEmpty}
            className="w-full px-4 py-2 bg-yellow-600/20 text-yellow-400 rounded-lg text-sm font-medium hover:bg-yellow-600/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {deletingEmpty ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
            Apagar Pastas Vazias
          </button>
          {emptyResult && (
            <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              {emptyResult}
            </p>
          )}
        </div>

        {/* Detect orphan media */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="bg-red-500/10 p-2 rounded-lg">
              <ImageOff className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Mídias Órfãs</h3>
              <p className="text-xs text-white/40">
                Sem referência em nenhum post
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDetectOrphans}
            disabled={detectingOrphans}
            className="w-full px-4 py-2 bg-red-600/20 text-red-400 rounded-lg text-sm font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {detectingOrphans ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Detectar Mídias Órfãs
          </button>
          {orphanResult && !orphans && (
            <p className="text-xs text-white/50 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              {orphanResult}
            </p>
          )}
        </div>
      </div>

      {/* Orphan media results */}
      {orphans && orphans.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h3 className="font-semibold text-sm">
                {orphans.length} mídia(s) órfã(s) encontrada(s)
              </h3>
              <span className="text-xs text-white/40">
                ({formatBytes(orphans.reduce((a, o) => a + o.size, 0))})
              </span>
            </div>
            <button
              type="button"
              onClick={handleDeleteOrphans}
              disabled={deletingOrphans}
              className="px-3 py-1.5 bg-red-600/20 text-red-400 rounded-lg text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {deletingOrphans ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Trash2 className="w-3 h-3" />
              )}
              Apagar Todas
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto">
            <table className="w-full text-sm">
              <tbody>
                {orphans.map((o) => (
                  <tr
                    key={o.relativePath}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-2 text-white/60 font-mono text-xs truncate max-w-md">
                      {o.relativePath}
                    </td>
                    <td className="px-5 py-2 text-right text-white/40 text-xs">
                      {formatBytes(o.size)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orphanResult && (
            <div className="px-5 py-3 border-t border-white/10">
              <p className="text-xs text-green-400 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                {orphanResult}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Posts table */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h2 className="font-semibold">Mídias por Post ({posts.length})</h2>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-white/40" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:ring-1 focus:ring-green-500/50"
            >
              <option value="date-desc">Data (mais recente)</option>
              <option value="date-asc">Data (mais antigo)</option>
              <option value="size-desc">Tamanho (maior)</option>
              <option value="size-asc">Tamanho (menor)</option>
            </select>
          </div>
        </div>
        <div className="overflow-x-auto max-h-128 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#2a3425]">
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Post</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  Data
                </th>
                <th className="text-right px-5 py-3 font-medium">Tamanho</th>
                <th className="text-center px-5 py-3 font-medium hidden sm:table-cell">
                  Mídias
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPosts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-white/30">
                    Nenhum post encontrado
                  </td>
                </tr>
              ) : (
                sortedPosts.map((post) => (
                  <tr
                    key={post.articleId}
                    className="border-t border-white/5 hover:bg-white/5"
                  >
                    <td className="px-5 py-3">
                      <p className="truncate max-w-xs" title={post.title}>
                        {post.title}
                      </p>
                      {post.imageUrl && (
                        <p className="text-xs text-white/30 font-mono truncate max-w-xs mt-0.5">
                          {post.imageUrl}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-white/40 text-xs hidden sm:table-cell whitespace-nowrap">
                      {new Date(
                        `${post.publishedAt}T12:00:00`,
                      ).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      {post.mediaSize > 0 ? (
                        <span className="text-white/70">
                          {formatBytes(post.mediaSize)}
                        </span>
                      ) : (
                        <span className="text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center text-white/40 hidden sm:table-cell">
                      {post.mediaCount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
