"use client";

import { useSearchParams } from "next/navigation";
import { reSendVerificationEmail } from "@/actions";
import { Mail } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

function ConfirmarEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  async function handleReSend() {
    if (email) {
      await reSendVerificationEmail(email);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Verifique seu email!</h1>
        
        <p className="text-gray-40>verir0 mb-6">
          Enviamos um link de confirmação para:
          <br />
          <span className="font-medium text-white">{email || "seu email"}</span>
        </p>

        <div className="bg-black/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-300">
            Por favor, verifique sua caixa de entrada e clique no link
            para confirmar seu email e continuar com a assinatura.
          </p>
        </div>

        <p className="text-gray-400">
          Não recebeu o email?{" "}
          <button 
            onClick={async () => await handleReSend()}
            className="text-primary-500 underline hover:no-underline cursor-pointer"
          >
            Reenviar
          </button>
        </p>

        <div className="mt-6 pt-6 border-t border-gray-700">
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-white"
          >
            Voltar ao início
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmarEmail() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  );
}