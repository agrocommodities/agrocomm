"use client";

import { useActionState } from "react";
import { resendVerificationAction } from "@/actions/emailVerification";

export default function ResendVerificationForm({
  defaultEmail,
}: {
  defaultEmail?: string;
}) {
  const [state, action, pending] = useActionState(
    resendVerificationAction,
    null,
  );

  if (state && "success" in state) {
    return (
      <div className="bg-green-400/10 border border-green-400/20 rounded-lg p-4">
        <p className="text-sm text-white/60 leading-relaxed">
          Se existir uma conta com esse e-mail, um novo link de ativação foi
          enviado. Verifique sua caixa de entrada e spam.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="email"
        type="email"
        required
        placeholder="seu@email.com"
        defaultValue={defaultEmail}
        className="bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-green-400/50 transition"
      />

      {state && "error" in state && (
        <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-2.5">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-2.5 text-sm transition-colors"
      >
        {pending ? "Enviando…" : "Reenviar e-mail de ativação"}
      </button>
    </form>
  );
}
