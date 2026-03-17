import Link from "next/link";
import { getQuotesByCategory } from "@/actions/quotes";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";
import Breadcrumb from "@/components/Breadcrumb";

export const revalidate = 300;
export const metadata = { title: "Grãos — AgroComm" };

const PRODUCTS = [
  { slug: "soja", label: "Soja", emoji: "🟡" },
  { slug: "milho", label: "Milho", emoji: "🌽" },
  { slug: "feijao", label: "Feijão", emoji: "🫘" },
];

export default async function GraosPage() {
  const quotes = await getQuotesByCategory("graos");

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Grãos" }]} />
          <h1 className="text-3xl font-bold mt-1">🌾 Grãos</h1>
          <p className="text-white/50 mt-1 text-sm">
            Cotações de soja, milho e feijão em saca (R$/60kg)
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
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
        title="Cotações de Hoje — Grãos"
      />

      <p className="text-center text-xs text-white/25">
        Clique em qualquer linha para ver o gráfico de evolução dos últimos 30
        dias.
      </p>
    </main>
  );
}
