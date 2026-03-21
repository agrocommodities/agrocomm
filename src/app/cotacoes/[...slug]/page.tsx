import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getProductQuotes,
  getStatesForProduct,
  getCitiesForProduct,
} from "@/actions/quotes";
import LocationPriceSelector from "@/components/LocationPriceSelector";
import ShareSidebar from "@/components/ShareSidebar";
import ProductQuotesTable from "@/components/ProductQuotesTable";
import Breadcrumb from "@/components/Breadcrumb";
import { TrendingUp, TrendingDown } from "lucide-react";

export const revalidate = 300;

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

  const [{ today }, allStates] = await Promise.all([
    getProductQuotes(produto),
    getStatesForProduct(produto),
  ]);

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

  const avgPrice = today.length
    ? today.reduce((s, r) => s + r.price, 0) / today.length
    : null;

  const avgVariation = today.length
    ? today
        .filter((r) => r.variation !== null)
        .reduce((s, r) => s + (r.variation ?? 0), 0) /
      today.filter((r) => r.variation !== null).length
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
      />

      {/* Summary cards */}
      {avgPrice !== null && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
            <p className="text-xs text-white/40 mb-1">Média do dia</p>
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
            <p className="text-xs text-white/40 mb-1">Praças hoje</p>
            <p className="text-2xl font-bold">{today.length}</p>
          </div>
        </div>
      )}

      {/* Today's table */}
      <ProductQuotesTable rows={today} productSlug={produto} />

      {/* Share sidebar */}
      <ShareSidebar url={shareUrl} title={shareTitle} />
    </main>
  );
}
