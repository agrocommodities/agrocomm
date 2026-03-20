"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/actions/auth";

export default function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  const router = useRouter();

  useEffect(() => {
    if (state && "success" in state) {
      router.refresh();
      router.push("/");
    }
  }, [state, router]);

  return (
    <form action={action} className="flex flex-col gap-5">
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
          defaultValue={
            state && "error" in state ? state.fields?.email : undefined
          }
          className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-white/80">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          placeholder="••••••••"
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
        {pending ? "Entrando…" : "Entrar"}
      </button>

      <p className="text-center text-sm text-white/50">
        Não tem conta?{" "}
        <Link href="/auth/cadastro" className="text-green-400 hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
