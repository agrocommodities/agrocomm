import Link from "next/link";
import { getQuotesByCategory } from "@/actions/quotes";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";

export const revalidate = 300;
export const metadata = { title: "Pecuária — AgroComm" };

const PRODUCTS = [
  { slug: "boi-gordo", label: "Boi Gordo", emoji: "🐂" },
  { slug: "vaca-gorda", label: "Vaca Gorda", emoji: "🐄" },
];

export default async function PecuariaPage() {
  const quotes = await getQuotesByCategory("pecuaria");

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <p className="text-sm text-white/40 mb-1">
            <Link href="/" className="hover:underline">
              Início
            </Link>{" "}
            / Pecuária
          </p>
          <h1 className="text-3xl font-bold">🐄 Pecuária</h1>
          <p className="text-white/50 mt-1 text-sm">
            Cotações de boi e vaca em arroba (R$/@)
          </p>
        </div>
        <div className="flex gap-3">
          {PRODUCTS.map((p) => (
            <Link
              key={p.slug}
              href={`/cotacoes/${p.slug}`}
              className="text-sm font-medium px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
            >
              {p.emoji} {p.label}
            </Link>
          ))}
        </div>
      </div>

      <CommoditiesTableClient
        quotes={quotes}
        title="Cotações de Hoje — Pecuária"
      />

      <p className="text-center text-xs text-white/25">
        Clique em qualquer linha para ver o gráfico de evolução dos últimos 30
        dias.
      </p>
    </main>
  );
}
