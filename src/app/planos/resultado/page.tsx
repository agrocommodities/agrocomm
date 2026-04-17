import Link from "next/link";
import { CheckCircle, Clock, XCircle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Resultado — AgroComm" };

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  if (status === "success") {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <CheckCircle className="w-20 h-20 mx-auto text-green-400 mb-6" />
          <h1 className="text-3xl font-extrabold mb-3">Pagamento aprovado!</h1>
          <p className="text-white/60 mb-8">
            Sua assinatura está ativa. Aproveite todos os recursos exclusivos.
          </p>
          <Link
            href="/ajustes"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-500 transition-colors"
          >
            Ir para ajustes
          </Link>
        </div>
      </main>
    );
  }

  if (status === "pending") {
    return (
      <main className="min-h-[80vh] flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Clock className="w-20 h-20 mx-auto text-yellow-400 mb-6" />
          <h1 className="text-3xl font-extrabold mb-3">Pagamento pendente</h1>
          <p className="text-white/60 mb-8">
            Estamos aguardando a confirmação do pagamento. Você receberá um
            e-mail quando for confirmado.
          </p>
          <Link
            href="/"
            className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-500 transition-colors"
          >
            Voltar ao início
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <XCircle className="w-20 h-20 mx-auto text-red-400 mb-6" />
        <h1 className="text-3xl font-extrabold mb-3">Pagamento recusado</h1>
        <p className="text-white/60 mb-8">
          Houve um problema com o pagamento. Tente novamente ou use outro método
          de pagamento.
        </p>
        <Link
          href="/planos"
          className="inline-block bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-500 transition-colors"
        >
          Tentar novamente
        </Link>
      </div>
    </main>
  );
}
