import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { getQuotesByCategory } from "@/actions/quotes";
import CalculadoraPecuaria from "./CalculadoraPecuaria";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Calculadora de Lucro na Pecuária",
  description:
    "Simule custos, receitas e lucro em sistemas de cria, recria e engorda de bovinos usando as cotações de boi e vaca do Agrocomm.",
  alternates: {
    canonical: "https://agrocomm.com.br/ferramentas/calculadora-pecuaria",
  },
};

export default async function CalculadoraPecuariaPage() {
  const livestockQuotes = await getQuotesByCategory("pecuaria");

  const quotes = livestockQuotes.map((quote) => ({
    label: quote.productName,
    productSlug: quote.productSlug,
    city: quote.city,
    state: quote.state,
    price: quote.price,
  }));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header>
        <Breadcrumb
          items={[
            { label: "Ferramentas", href: "/ferramentas" },
            { label: "Calculadora pecuária" },
          ]}
        />
        <div className="mt-2 flex flex-col gap-2">
          <h1 className="text-3xl font-bold sm:text-4xl">
            🐂 Calculadora de lucro na pecuária
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">
            Compare gastos e receitas em operações de cria, recria e engorda.
            A simulação utiliza as cotações de arroba já disponíveis no Agrocomm
            e permite ajustar todos os parâmetros à realidade da fazenda.
          </p>
        </div>
      </header>

      <CalculadoraPecuaria quotes={quotes} />
    </div>
  );
}
