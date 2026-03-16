"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { useEffect, useCallback } from "react";

export default function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const onClose = useCallback(() => {
    router.back();
  }, [router]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center">
      {/* Overlay */}
      {/* biome-ignore lint/a11y/useSemanticElements: overlay div cannot be a button */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onClose();
        }}
        role="button"
        tabIndex={-1}
        aria-label="Fechar modal"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4 bg-[#394634] border border-white/15 rounded-2xl shadow-2xl">
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
