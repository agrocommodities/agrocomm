"use client";

import { useTransition } from "react";
import { Eye, X } from "lucide-react";
import { stopImpersonatingAction } from "@/actions/admin";

interface Props {
  targetName: string | null;
}

export default function ImpersonationBanner({ targetName }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleStop() {
    startTransition(async () => {
      await stopImpersonatingAction();
      window.location.href = "/admin/usuarios";
    });
  }

  return (
    <div className="sticky top-0 z-200 flex items-center justify-center gap-3 bg-amber-600 text-white px-4 py-2 text-sm font-medium shadow-lg">
      <Eye className="w-4 h-4 shrink-0" />
      <span>
        Impersonificando <strong>{targetName ?? "visitante"}</strong>
      </span>
      <button
        type="button"
        onClick={handleStop}
        disabled={isPending}
        className="flex items-center gap-1 bg-white/20 hover:bg-white/30 rounded-lg px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ml-2 cursor-pointer"
      >
        <X className="w-3 h-3" />
        {isPending ? "Restaurando…" : "Parar"}
      </button>
    </div>
  );
}
