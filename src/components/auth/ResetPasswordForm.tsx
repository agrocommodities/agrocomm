"use client";

import { useActionState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/actions/passwordReset";

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPassword, null);
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") ?? "";

  useEffect(() => {
    if (state && "success" in state) {
      const timer = setTimeout(() => router.push("/login"), 3000);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  if (!token) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-6">
          <p className="text-sm text-red-400">
            Link de redefinição inválido. Solicite um novo link.
          </p>
        </div>
        <Link
          href="/esqueci-senha"
          className="text-sm text-green-400 hover:underline"
        >
          Solicitar novo link
        </Link>
      </div>
    );
  }

  if (state && "success" in state) {
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
            Senha redefinida!
          </h2>
          <p className="text-sm text-white/60">
            Sua senha foi alterada com sucesso. Redirecionando para o login…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />

      <p className="text-sm text-white/60 leading-relaxed">
        Escolha uma nova senha para sua conta.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          Nova senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-white/80">
          Confirmar nova senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="Repita a nova senha"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      {state && "error" in state && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {pending ? "Redefinindo…" : "Redefinir senha"}
      </button>

      <p className="text-center text-sm text-white/50">
        <Link href="/esqueci-senha" className="text-green-400 hover:underline">
          Solicitar novo link
        </Link>
      </p>
    </form>
  );
}
