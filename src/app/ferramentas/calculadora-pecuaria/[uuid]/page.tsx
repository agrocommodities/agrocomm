import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/Breadcrumb";
import { getQuotesByCategory } from "@/actions/quotes";
import { getSharedCalculation } from "@/actions/shared-calculations";
import NumericInputEnhancer from "../NumericInputEnhancer";
import SistemasProdutivosCalculatorV3 from "../SistemasProdutivosCalculatorV3";
import ShareCalculatorControls from "../ShareCalculatorControls";

type Props = {
  params: Promise<{ uuid: string }>;
};

export const metadata: Metadata = {
  title: "Simulação compartilhada — Calculadora Pecuária",
  description:
    "Visualize uma simulação compartilhada de custos, receitas e lucro na pecuária.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function SharedCalculatorPage({ params }: Props) {
  const { uuid } = await params;
  const [savedData, livestockQuotes] = await Promise.all([
    getSharedCalculation(uuid),
    getQuotesByCategory("pecuaria"),
  ]);

  if (!savedData) notFound();

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
            {
              label: "Calculadora pecuária",
              href: "/ferramentas/calculadora-pecuaria",
            },
            { label: "Simulação compartilhada" },
          ]}
        />
        <div className="mt-2 flex min-w-0 flex-col gap-2">
          <h1 className="break-words text-3xl font-bold sm:text-4xl">
            🐂 Simulação pecuária compartilhada
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-white/50 sm:text-base">
            Os campos abaixo foram recuperados de uma simulação salva. Você pode
            alterá-los e criar um novo link sem modificar o compartilhamento
            original.
          </p>
        </div>
      </header>

      <ShareCalculatorControls initialData={savedData} />

      <div
        data-calculator-root
        className="min-w-0 max-w-full overflow-x-hidden [&_div]:min-w-0 [&_input]:min-w-0 [&_input]:max-w-full [&_label]:min-w-0 [&_section]:min-w-0 [&_section]:max-w-full [&_select]:min-w-0 [&_select]:w-full [&_select]:max-w-full"
      >
        <NumericInputEnhancer />
        <SistemasProdutivosCalculatorV3 quotes={quotes} />
      </div>
    </div>
  );
}
