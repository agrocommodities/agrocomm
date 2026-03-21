"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  deleteUserClassified,
  pauseUserClassified,
} from "@/actions/classifieds";
import { Pencil, Trash2, Pause, Play } from "lucide-react";
import Link from "next/link";

export default function ClassifiedOwnerActions({
  classifiedId,
  slug,
  status,
}: {
  classifiedId: number;
  slug: string;
  status: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handlePause() {
    startTransition(async () => {
      const result = await pauseUserClassified(classifiedId);
      if (result.success) router.refresh();
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteUserClassified(classifiedId);
      if (result.success) router.push("/classificados");
    });
  }

  const canPause = status === "approved" || status === "paused";
  const isPaused = status === "paused";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/classificados/${slug}/editar`}
        className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
      >
        <Pencil className="w-4 h-4" />
        Editar
      </Link>

      {canPause && (
        <button
          type="button"
          onClick={handlePause}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-50"
        >
          {isPaused ? (
            <>
              <Play className="w-4 h-4" />
              Reativar
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              Pausar
            </>
          )}
        </button>
      )}

      {confirmDelete ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-red-400">Tem certeza?</span>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Confirmar
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="text-sm text-white/50 hover:text-white transition-colors"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" />
          Excluir
        </button>
      )}
    </div>
  );
}
