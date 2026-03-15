"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, null);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-white/80">
          Nome completo
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          autoComplete="name"
          placeholder="João da Silva"
          defaultValue={state?.fields?.name}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

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
          defaultValue={state?.fields?.email}
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          Senha
          <span className="ml-1 text-white/30 font-normal">
            (mín. 8 caracteres)
          </span>
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="••••••••"
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="confirm" className="text-sm font-medium text-white/80">
          Confirmar senha
        </label>
        <input
          id="confirm"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          placeholder="••••••••"
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
        {pending ? "Criando conta…" : "Criar conta"}
      </button>

      <p className="text-center text-sm text-white/50">
        Já tem conta?{" "}
        <Link href="/auth/login" className="text-green-400 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
