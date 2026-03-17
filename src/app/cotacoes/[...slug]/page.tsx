import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getProductQuotes,
  getStatesForProduct,
  getCitiesForProduct,
} from "@/actions/quotes";
import LocationPriceSelector from "@/components/LocationPriceSelector";
import ShareSidebar from "@/components/ShareSidebar";
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
}) {
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
    <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
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
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-base">
            Cotações de hoje por praça
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide">
                <th className="text-left px-5 py-3 font-medium">Estado</th>
                <th className="text-left px-5 py-3 font-medium">Cidade</th>
                <th className="text-right px-5 py-3 font-medium">Preço</th>
                <th className="text-right px-5 py-3 font-medium">Variação</th>
              </tr>
            </thead>
            <tbody>
              {today.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-white/30">
                    Sem cotações para hoje
                  </td>
                </tr>
              ) : (
                today.map((row) => (
                  <tr
                    key={row.id}
                    className="border-t border-white/5 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-3 text-white/60">
                      <Link
                        href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${produto}`}
                        className="hover:text-green-400 transition-colors"
                      >
                        {row.state}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-white/60">
                      <Link
                        href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${produto}`}
                        className="hover:text-green-400 transition-colors"
                      >
                        {row.city}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right font-semibold">
                      <Link
                        href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${produto}`}
                        className="hover:text-green-400 transition-colors"
                      >
                        R$ {row.price.toFixed(2)}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        href={`/cotacoes/${row.state.toLowerCase()}/${row.citySlug}/${produto}`}
                        className="hover:text-green-400 transition-colors"
                      >
                        {row.variation !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                              row.variation >= 0
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}
                          >
                            {row.variation >= 0 ? "+" : ""}
                            {row.variation.toFixed(2)}%
                          </span>
                        ) : (
                          <span className="text-white/30">—</span>
                        )}
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Share sidebar */}
      <ShareSidebar url={shareUrl} title={shareTitle} />
    </main>
  );
}
