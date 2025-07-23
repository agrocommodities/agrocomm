"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      if (response.ok) {
        setStatus("success");
        // Redirecionar para assinaturas após 3 segundos
        setTimeout(() => {
          router.push("/assinaturas");
        }, 3000);
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
            <h1 className="text-xl font-bold">Verificando email...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Email verificado!</h1>
            <p className="text-gray-400 mb-4">
              Seu email foi confirmado com sucesso.
            </p>
            <p className="text-sm text-gray-300">
              Você será redirecionado para a página de assinaturas...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Erro na verificação</h1>
            <p className="text-gray-400 mb-6">
              O link de verificação é inválido ou expirou.
            </p>
            <Link
              href="/cadastro"
              className="text-primary-500 hover:underline"
            >
              Tentar novamente
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function VerificarEmail() {
  return (
    <Suspense fallback={
      <div className="w-full max-w-md mx-auto">
        <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Carregando...</p>
        </div>
      </div>
    }>
      <VerificarEmailContent />
    </Suspense>
  );
}