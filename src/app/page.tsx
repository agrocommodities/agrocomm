import Link from "next/link";
import { getTodayQuotes } from "@/actions/quotes";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";

export const revalidate = 300; // 5 min

export default async function HomePage() {
  const allQuotes = await getTodayQuotes();
  const pecuaria = allQuotes.filter((q) => q.category === "pecuaria");
  const graos = allQuotes.filter((q) => q.category === "graos");

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-10">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold">Cotações do Dia</h1>
          <p className="text-white/50 mt-1 capitalize">{today}</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/cotacoes/pecuaria"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
          >
            Pecuária
          </Link>
          <Link
            href="/cotacoes/graos"
            className="text-sm font-medium px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
          >
            Grãos
          </Link>
        </div>
      </div>

      {/* Pecuária */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">🐄 Pecuária</h2>
          <Link
            href="/cotacoes/pecuaria"
            className="text-xs text-green-400 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <CommoditiesTableClient quotes={pecuaria} title="Arroba — Boi & Vaca" />
      </section>

      {/* Grãos */}
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white/80">🌾 Grãos</h2>
          <Link
            href="/cotacoes/graos"
            className="text-xs text-green-400 hover:underline"
          >
            Ver todos →
          </Link>
        </div>
        <CommoditiesTableClient
          quotes={graos}
          title="Saca — Soja, Milho & Feijão"
        />
      </section>

      <p className="text-center text-xs text-white/25 mt-2">
        Clique em qualquer linha para ver o gráfico de evolução dos últimos 30
        dias.
      </p>
    </main>
  );
}
