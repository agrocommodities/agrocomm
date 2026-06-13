import type { Metadata } from "next";
import Breadcrumb from "@/components/Breadcrumb";
import { getQuotesByCategory } from "@/actions/quotes";
import NumericInputEnhancer from "./NumericInputEnhancer";
import SelectEnhancer from "./SelectEnhancer";
import SistemasProdutivosCalculatorV3 from "./SistemasProdutivosCalculatorV3";
import ShareCalculatorControls from "./ShareCalculatorControls";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Calculadora de Lucro na Pecuária",
  description:
    "Compare sistemas de cria, recria e engorda, com vendas de gado vivo e para abate.",
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
    <div className="mx-auto flex min-w-0 max-w-7xl flex-col gap-8 overflow-x-hidden">
      <header className="min-w-0">
        <Breadcrumb
          items={[
            { label: "Ferramentas", href: "/ferramentas" },
            { label: "Calculadora pecuária" },
          ]}
        />
        <div className="mt-2 flex min-w-0 flex-col gap-2">
          <h1 className="break-words text-3xl font-bold sm:text-4xl">
            🐂 Calculadora de lucro na pecuária
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">
            Escolha um sistema produtivo específico e compare sua rentabilidade
            com as demais modalidades de cria, recria e engorda.
          </p>
        </div>
      </header>

      <ShareCalculatorControls />

      <div
        data-calculator-root
        className="min-w-0 max-w-full overflow-x-hidden [&_div]:min-w-0 [&_input]:min-w-0 [&_input]:max-w-full [&_label]:min-w-0 [&_section]:min-w-0 [&_section]:max-w-full [&_select]:min-w-0 [&_select]:w-full [&_select]:max-w-full"
      >
        <NumericInputEnhancer />
        <SelectEnhancer />
        <SistemasProdutivosCalculatorV3 quotes={quotes} />
      </div>
    </div>
  );
}
