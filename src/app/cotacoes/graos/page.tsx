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
  title: "Cotações de Grãos — Soja, Milho e Feijão",
  description:
    "Cotações atualizadas de grãos: preço da soja, milho e feijão em R$/saca (60kg) por estado e cidade. Acompanhe a variação diária das commodities agrícolas.",
  openGraph: {
    title: "Cotações de Grãos — Soja, Milho e Feijão",
    description:
      "Preços atualizados de soja, milho e feijão em R$/saca por estado e cidade.",
  },
  alternates: {
    canonical: "https://agrocomm.com.br/cotacoes/graos",
  },
};

const PRODUCTS = [
  { slug: "soja", label: "Soja", emoji: "🟡" },
  { slug: "milho", label: "Milho", emoji: "🌽" },
  { slug: "feijao", label: "Feijão", emoji: "🫘" },
];

export default async function GraosPage() {
  const [quotes, session] = await Promise.all([
    getQuotesByCategory("graos"),
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
