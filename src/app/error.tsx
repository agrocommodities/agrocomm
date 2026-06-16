"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Link href="/" className="flex items-center gap-2 mb-8">
        <Image src="/images/logo.svg" alt="AgroComm" width={40} height={40} />
        <span className="text-2xl font-bold">AgroComm</span>
      </Link>

      <p className="text-8xl font-bold text-white/10 select-none mb-2">500</p>

      <h1 className="text-2xl sm:text-3xl font-bold">Algo deu errado</h1>
      <p className="text-white/60 mt-3 max-w-md">
        Ocorreu um problema inesperado. Nossa equipe já foi notificada e está
        trabalhando para resolver. Tente novamente em instantes.
      </p>

      <div className="flex flex-wrap justify-center gap-3 mt-8">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-green-500"
        >
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-white/10 px-6 py-3 text-sm font-medium transition hover:bg-white/20"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
