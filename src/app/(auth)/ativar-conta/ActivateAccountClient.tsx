"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { verifyEmailAction } from "@/actions/emailVerification";
import ResendVerificationForm from "@/components/auth/ResendVerificationForm";

export default function ActivateAccountClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token de ativação não encontrado.");
      return;
    }

    verifyEmailAction(token).then((result) => {
      if (result && "success" in result) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result?.error ?? "Erro ao ativar conta.");
      }
    });
  }, [token]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="w-8 h-8 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-white/60">Ativando sua conta…</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-6">
          <svg
            className="w-12 h-12 text-green-400 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">
            Conta ativada!
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Seu e-mail foi verificado com sucesso. Agora você pode acessar sua
            conta.
          </p>
        </div>
        <Link
          href="/login"
          className="bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors text-center"
        >
          Fazer login
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-center">
      <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-6">
        <svg
          className="w-12 h-12 text-red-400 mx-auto mb-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-white mb-2">
          Falha na ativação
        </h2>
        <p className="text-sm text-white/60 leading-relaxed">{errorMessage}</p>
      </div>

      <div className="border-t border-white/10 pt-4">
        <p className="text-sm text-white/50 mb-3">
          Solicitar novo e-mail de ativação:
        </p>
        <ResendVerificationForm />
      </div>
    </div>
  );
}
