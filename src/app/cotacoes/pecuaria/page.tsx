import Link from "next/link";
import type { Metadata } from "next";
import { getQuotesByCategory } from "@/actions/quotes";
import {
  getUserQuoteSubscriptions,
  getUserSubscription,
} from "@/actions/subscriptions";
import { getSession } from "@/lib/auth";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";
import Breadcrumb from "@/components/Breadcrumb";

export const revalidate = 300;
export const metadata: Metadata = {
  title: "Cotações de Pecuária — Boi Gordo e Vaca Gorda",
  description:
    "Cotações atualizadas de pecuária: preço do boi gordo e vaca gorda em R$/arroba por estado e cidade. Acompanhe a variação diária do mercado pecuário brasileiro.",
  openGraph: {
    title: "Cotações de Pecuária — Boi Gordo e Vaca Gorda",
    description:
      "Preços atualizados de boi gordo e vaca gorda em R$/arroba por estado e cidade.",
  },
  alternates: {
    canonical: "https://agrocomm.com.br/cotacoes/pecuaria",
  },
};

const PRODUCTS = [
  { slug: "boi-gordo", label: "Boi Gordo", emoji: "🐂" },
  { slug: "vaca-gorda", label: "Vaca Gorda", emoji: "🐄" },
];

export default async function PecuariaPage() {
  const [quotes, session] = await Promise.all([
    getQuotesByCategory("pecuaria"),
    getSession(),
  ]);

  let subscribedQuotes = new Set<string>();
  let hasActivePlan = false;

  if (session) {
    const [subs, sub] = await Promise.all([
      getUserQuoteSubscriptions(),
      getUserSubscription(),
    ]);
    subscribedQuotes = new Set(
      subs.map((s) => `${s.productId}-${s.cityId ?? 0}`),
    );
    hasActivePlan = sub?.status === "active";
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <Breadcrumb items={[{ label: "Pecuária" }]} />
          <h1 className="text-3xl font-bold mt-1">🐄 Pecuária</h1>
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
        subscribedQuotes={subscribedQuotes}
        hasSession={!!session}
        hasActivePlan={hasActivePlan}
      />

      <p className="text-center text-xs text-white/25">
        Clique em qualquer linha para ver o gráfico de evolução dos últimos 30
        dias.
      </p>
    </div>
  );
}
