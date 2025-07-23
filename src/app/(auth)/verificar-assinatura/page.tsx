// src/app/(auth)/verificar-assinatura/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function VerificarAssinatura() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.exists) {
        // Email existe - redirecionar para login
        router.push(`/entrar?email=${encodeURIComponent(email)}&redirect=/assinaturas`);
      } else {
        // Email não existe - redirecionar para cadastro
        router.push(`/cadastro?email=${encodeURIComponent(email)}&redirect=/assinaturas`);
      }
    } catch (error) {
      console.error("Erro ao verificar email:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-black/50 border-2 border-black/40 rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Assine o AgroComm</h1>
          <p className="text-gray-400">
            Para continuar, informe seu email
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !email}
            className="w-full"
          >
            {loading ? "Verificando..." : "Continuar"}
          </Button>
        </form>
      </div>
    </div>
  );
}