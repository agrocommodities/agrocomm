// src/app/(auth)/verificar-email/page.tsx
"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Mail, RefreshCw, Clock } from "lucide-react";
import Button from "@/components/ui/button";
import Input from "@/components/ui/input";

interface ResendState {
  loading: boolean;
  success: boolean;
  error: string | null;
  attemptsRemaining: number;
  totalAttempts: number;
  maxAttempts: number;
  cooldownSeconds: number;
}

function VerificarEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const emailParam = searchParams.get("email");
  
  const [status, setStatus] = useState<"loading" | "success" | "error" | "manual">("loading");
  const [result, setResult] = useState<any>(null);
  const [email, setEmail] = useState(emailParam || "");
  const [resendState, setResendState] = useState<ResendState>({
    loading: false,
    success: false,
    error: null,
    attemptsRemaining: 10,
    totalAttempts: 0,
    maxAttempts: 10,
    cooldownSeconds: 0,
  });

  // ✅ Countdown para cooldown
  useEffect(() => {
    if (resendState.cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setResendState(prev => ({
          ...prev,
          cooldownSeconds: prev.cooldownSeconds - 1
        }));
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [resendState.cooldownSeconds]);

  useEffect(() => {
    if (token) {
      verifyEmailToken(token);
    } else {
      setStatus("manual");
    }
  }, [token]);

  const verifyEmailToken = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setResult(data);
        setTimeout(() => router.push("/?welcome=true"), 2000);
      } else {
        setStatus("error");
        setResult(data);
      }
    } catch (error) {
      setStatus("error");
      setResult({ error: "Erro de conexão" });
    }
  };

  const handleResendCode = async () => {
    if (!email || resendState.loading || resendState.cooldownSeconds > 0) return;

    setResendState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResendState(prev => ({
          ...prev,
          loading: false,
          success: true,
          error: null,
          attemptsRemaining: data.attemptsRemaining || 0,
          totalAttempts: data.totalAttempts || 0,
          maxAttempts: data.maxAttempts || 10,
          cooldownSeconds: 120, // 2 minutos
        }));
        
        // Limpar sucesso após 3 segundos
        setTimeout(() => {
          setResendState(prev => ({ ...prev, success: false }));
        }, 3000);
      } else {
        // Extrair cooldown da mensagem de erro se disponível
        let cooldownTime = 0;
        if (data.error?.includes("Aguarde")) {
          const match = data.error.match(/(\d+)\s+minuto/);
          if (match) {
            cooldownTime = parseInt(match[1]) * 60;
          }
        }

        setResendState(prev => ({
          ...prev,
          loading: false,
          error: data.error,
          cooldownSeconds: cooldownTime,
        }));
      }
    } catch (error) {
      setResendState(prev => ({
        ...prev,
        loading: false,
        error: "Erro de conexão",
      }));
    }
  };

  // Status: Loading
  if (status === "loading") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h1 className="text-xl font-bold">Verificando email...</h1>
        </div>
      </div>
    );
  }

  // Status: Success
  if (status === "success") {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Email verificado!</h1>
          <p className="text-gray-400 mb-4">{result?.message}</p>
          <p className="text-sm text-green-400">
            Redirecionando em instantes...
          </p>
        </div>
      </div>
    );
  }

  // Status: Error ou Manual
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-6">
          {status === "error" ? (
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          ) : (
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          )}
          
          <h1 className="text-2xl font-bold mb-2">
            {status === "error" ? "Erro na verificação" : "Verificar Email"}
          </h1>
          
          <p className="text-gray-400">
            {status === "error" 
              ? "O link de verificação é inválido ou expirou" 
              : "Digite seu email para receber um novo código"}
          </p>
        </div>

        {/* Email Input */}
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full"
            />
          </div>

          {/* ✅ Botão de Reenvio com Estados */}
          <Button
            onClick={handleResendCode}
            disabled={!email || resendState.loading || resendState.cooldownSeconds > 0}
            className="w-full flex items-center justify-center gap-2"
          >
            {resendState.loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Enviando...
              </>
            ) : resendState.cooldownSeconds > 0 ? (
              <>
                <Clock className="w-4 h-4" />
                Aguarde {Math.floor(resendState.cooldownSeconds / 60)}:
                {String(resendState.cooldownSeconds % 60).padStart(2, '0')}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                {resendState.totalAttempts > 0 ? "Reenviar Código" : "Enviar Código"}
              </>
            )}
          </Button>

          {/* ✅ Status Messages */}
          {resendState.success && (
            <div className="p-3 bg-green-900/20 border border-green-600 rounded-md">
              <p className="text-sm text-green-400">
                ✅ Código enviado com sucesso! Verifique sua caixa de entrada.
              </p>
            </div>
          )}

          {resendState.error && (
            <div className="p-3 bg-red-900/20 border border-red-600 rounded-md">
              <p className="text-sm text-red-400">
                ❌ {resendState.error}
              </p>
            </div>
          )}

          {/* ✅ Attempts Counter */}
          {resendState.totalAttempts > 0 && (
            <div className="text-center">
              <p className="text-xs text-gray-500">
                Tentativas: {resendState.totalAttempts}/{resendState.maxAttempts}
                {resendState.attemptsRemaining > 0 && (
                  <span className="text-yellow-400">
                    {" "}({resendState.attemptsRemaining} restantes)
                  </span>
                )}
              </p>
              
              {resendState.attemptsRemaining <= 2 && resendState.attemptsRemaining > 0 && (
                <p className="text-xs text-orange-400 mt-1">
                  ⚠️ Poucas tentativas restantes!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-700 text-center">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Voltar ao início
          </button>
        </div>
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