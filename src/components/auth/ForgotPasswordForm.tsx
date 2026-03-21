"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/actions/passwordReset";

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  if (state?.success) {
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
              d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
            />
          </svg>
          <h2 className="text-lg font-semibold text-white mb-2">
            E-mail enviado!
          </h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Se existir uma conta com esse e-mail, você receberá um link para
            redefinir sua senha. Verifique sua caixa de entrada e spam.
          </p>
        </div>
        <Link href="/login" className="text-sm text-green-400 hover:underline">
          Voltar ao login
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <p className="text-sm text-white/60 leading-relaxed">
        Informe o e-mail cadastrado na sua conta. Enviaremos um link para
        redefinir sua senha.
      </p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-sm font-medium text-white/80">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="seu@email.com"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {pending ? "Enviando…" : "Enviar link de redefinição"}
      </button>

      <p className="text-center text-sm text-white/50">
        Lembrou a senha?{" "}
        <Link href="/login" className="text-green-400 hover:underline">
          Fazer login
        </Link>
      </p>
    </form>
  );
}
