import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductQuotes,
  getStatesForProduct,
  getCitiesForProduct,
} from "@/actions/quotes";
import {
  getUserQuoteSubscriptions,
  getUserSubscription,
} from "@/actions/subscriptions";
import { getSession } from "@/lib/auth";
import LocationPriceSelector from "@/components/LocationPriceSelector";
import ShareSidebar from "@/components/ShareSidebar";
import ProductQuotesTable from "@/components/ProductQuotesTable";
import HistoryQuotesClient from "@/components/HistoryQuotesClient";
import DateRangeCompare from "@/components/DateRangeCompare";
import Breadcrumb from "@/components/Breadcrumb";
import { TrendingUp, TrendingDown } from "lucide-react";

export const revalidate = 300;

function formatQuoteDate(dateStr: string): string {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const PRODUCT_META: Record<
  string,
  {
    label: string;
    emoji: string;
    category: string;
    categoryLabel: string;
    categorySlug: string;
  }
> = {
  "boi-gordo": {
    label: "Boi Gordo",
    emoji: "🐂",
    category: "pecuaria",
    categoryLabel: "Pecuária",
    categorySlug: "pecuaria",
  },
  "vaca-gorda": {
    label: "Vaca Gorda",
    emoji: "🐄",
    category: "pecuaria",
    categoryLabel: "Pecuária",
    categorySlug: "pecuaria",
  },
  soja: {
    label: "Soja",
    emoji: "🟡",
    category: "graos",
    categoryLabel: "Grãos",
    categorySlug: "graos",
  },
  milho: {
    label: "Milho",
    emoji: "🌽",
    category: "graos",
    categoryLabel: "Grãos",
    categorySlug: "graos",
  },
  feijao: {
    label: "Feijão",
    emoji: "🫘",
    category: "graos",
    categoryLabel: "Grãos",
    categorySlug: "graos",
  },
};

/** Parse [...slug] into { produto, estado?, cidade? } */
function parseSlug(slug: string[]): {
  produto: string;
  estado?: string;
  cidade?: string;
} | null {
  if (slug.length === 1) {
    // /cotacoes/soja
    return { produto: slug[0] };
  }
  if (slug.length === 3) {
    // /cotacoes/df/brasilia/soja
    return {
      estado: slug[0].toUpperCase(),
      cidade: slug[1],
      produto: slug[2],
    };
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return {};
  const meta = PRODUCT_META[parsed.produto];
  if (!meta) return {};
  return { title: `${meta.label} — AgroComm` };
}

export default async function ProdutoPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const { produto, estado, cidade } = parsed;
  const meta = PRODUCT_META[produto];
  if (!meta) notFound();

  const [{ today }, allStates, session] = await Promise.all([
    getProductQuotes(produto),
    getStatesForProduct(produto),
    getSession(),
  ]);

  let hasActivePlan = false;
  let hasEmailBulletinsPlan = false;
  let historyDays = 0;
  let subscribedQuotes: string[] = [];

  if (session) {
    const [sub, quoteSubscriptions] = await Promise.all([
      getUserSubscription(),
      getUserQuoteSubscriptions(),
    ]);

    if (sub?.status === "active" && sub.priceHistory) {
      hasActivePlan = true;
      historyDays = sub.historyDays;
    }

    hasEmailBulletinsPlan =
      sub?.status === "active" && Boolean(sub.emailBulletins);
    subscribedQuotes = quoteSubscriptions.map(
      (quoteSubscription) =>
        `${quoteSubscription.productId}-${quoteSubscription.cityId ?? 0}`,
    );
  }

  const citiesByState: Record<
    string,
    { id: number; name: string; slug: string }[]
  > = {};
  await Promise.all(
    allStates.map(async (s) => {
      citiesByState[s.code] = await getCitiesForProduct(produto, s.code);
    }),
  );

  const unit = today[0]?.unit ?? "";
  const quoteDate = today[0]?.quoteDate ?? "";
  const formattedQuoteDate = quoteDate ? formatQuoteDate(quoteDate) : null;

  const avgPrice = today.length
    ? today.reduce((s, r) => s + r.price, 0) / today.length
    : null;

  const quotesWithVariation = today.filter((r) => r.variation !== null);
  const avgVariation = quotesWithVariation.length
    ? quotesWithVariation.reduce((s, r) => s + (r.variation ?? 0), 0) /
      quotesWithVariation.length
    : null;

  const shareUrl =
    estado && cidade
      ? `https://agrocomm.com.br/cotacoes/${estado.toLowerCase()}/${cidade}/${produto}`
      : `https://agrocomm.com.br/cotacoes/${produto}`;
  const shareTitle = `${meta.label} — Cotações AgroComm`;

  return (
    <main className="max-w-7xl mx-auto flex flex-col gap-6">
      {/* Breadcrumb + header */}
      <div>
        <Breadcrumb
          items={[
            {
              label: meta.categoryLabel,
              href: `/cotacoes/${meta.categorySlug}`,
            },
            { label: meta.label },
          ]}
        />
        <h1 className="text-3xl font-bold mt-1">
          {meta.emoji} {meta.label}
        </h1>
        {unit && <p className="text-white/50 text-sm mt-0.5">{unit}</p>}
        {formattedQuoteDate && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-100">
            <span className="font-medium">Data da cotação:</span>
            <span>{formattedQuoteDate}</span>
          </div>
        )}
      </div>

      {/* Location + price selector + chart */}
      <LocationPriceSelector
        key={`${estado ?? ""}-${cidade ?? ""}`}
        todayQuotes={today}
        allStates={allStates}
        citiesByState={citiesByState}
        unit={unit}
        productSlug={produto}
        initialState={estado}
        initialCitySlug={cidade}
        subscribedQuotes={subscribedQuotes}
        hasSession={!!session}
        hasActivePlan={hasEmailBulletinsPlan}
      />

      {/* Summary cards */}
      {avgPrice !== null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-xs text-white/40 mb-1">Média da cotação</p>
            <p className="text-2xl font-bold">R$ {avgPrice.toFixed(2)}</p>
          </div>
          {avgVariation !== null && (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
              <p className="text-xs text-white/40 mb-1">Variação média</p>
              <p
                className={`text-2xl font-bold flex items-center gap-1 ${
                  avgVariation >= 0 ? "text-green-400" : "text-red-400"
                }`}
              >
                {avgVariation >= 0 ? (
                  <TrendingUp className="w-5 h-5" />
                ) : (
                  <TrendingDown className="w-5 h-5" />
                )}
                {avgVariation >= 0 ? "+" : ""}
                {avgVariation.toFixed(2)}%
              </p>
            </div>
          )}
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-xs text-white/40 mb-1">Praças na cotação</p>
            <p className="text-2xl font-bold">{today.length}</p>
          </div>
        </div>
      )}

      {/* Today's table */}
      <ProductQuotesTable rows={today} productSlug={produto} />

      {/* Historical query */}
      <HistoryQuotesClient
        productSlug={produto}
        hasActivePlan={hasActivePlan}
        historyDays={historyDays}
      />

      {/* Date range comparison */}
      <DateRangeCompare
        productSlug={produto}
        hasActivePlan={hasActivePlan}
        historyDays={historyDays}
      />

      {/* Share sidebar */}
      <ShareSidebar url={shareUrl} title={shareTitle} />
    </main>
  );
}
