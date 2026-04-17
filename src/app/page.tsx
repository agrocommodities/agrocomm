import Link from "next/link";
import { getTodayQuotes, type QuoteRow } from "@/actions/quotes";
import { getLatestNews } from "@/actions/news";
import { getClassifieds } from "@/actions/classifieds";
import { getUserSubscription } from "@/actions/subscriptions";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";
import CommoditySidebar from "@/components/CommoditySidebar";
import ClassifiedsSidebar from "@/components/ClassifiedsSidebar";
import {
  Clock,
  ArrowRight,
  Newspaper,
  Crown,
  TrendingUp,
  Mail,
  BarChart3,
} from "lucide-react";

export const revalidate = 300; // 5 min

const categoryColors: Record<string, string> = {
  graos: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
  pecuaria: "bg-orange-400/10 text-orange-400 border-orange-400/20",
  clima: "bg-blue-400/10 text-blue-400 border-blue-400/20",
  geral: "bg-white/5 text-white/50 border-white/10",
};

const categoryLabels: Record<string, string> = {
  graos: "Grãos",
  pecuaria: "Pecuária",
  clima: "Clima",
  geral: "Geral",
};

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  const months = [
    "",
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${day} ${months[Number(month)]} ${year}`;
}

/** Capitais dos estados brasileiros (para priorizar na amostragem) */
const STATE_CAPITALS: Record<string, string> = {
  AC: "Rio Branco",
  AL: "Maceió",
  AP: "Macapá",
  AM: "Manaus",
  BA: "Salvador",
  CE: "Fortaleza",
  DF: "Brasília",
  ES: "Vitória",
  GO: "Goiânia",
  MA: "São Luís",
  MT: "Cuiabá",
  MS: "Campo Grande",
  MG: "Belo Horizonte",
  PA: "Belém",
  PB: "João Pessoa",
  PR: "Curitiba",
  PE: "Recife",
  PI: "Teresina",
  RJ: "Rio de Janeiro",
  RN: "Natal",
  RS: "Porto Alegre",
  RO: "Porto Velho",
  RR: "Boa Vista",
  SC: "Florianópolis",
  SP: "São Paulo",
  SE: "Aracaju",
  TO: "Palmas",
};

/**
 * Amostra cotações: 1 cidade por estado (preferindo a capital).
 * Mostra todos os produtos disponíveis para a cidade selecionada.
 * Limita a 8 estados para não poluir o visual.
 */
function sampleQuotes(rows: QuoteRow[]): QuoteRow[] {
  // Agrupa cidades por estado
  const citiesByState = new Map<string, Set<string>>();
  for (const row of rows) {
    const set = citiesByState.get(row.state);
    if (set) set.add(row.city);
    else citiesByState.set(row.state, new Set([row.city]));
  }

  // Para cada estado, escolhe a capital ou uma cidade aleatória (hash do dia)
  const today = new Date().toISOString().slice(0, 10);
  let hash = 0;
  for (let i = 0; i < today.length; i++) {
    hash = (hash * 31 + today.charCodeAt(i)) | 0;
  }

  // Seleciona apenas 8 estados (de forma determinística baseada no dia)
  const allStates = [...citiesByState.keys()];
  const selectedStates: string[] = [];

  // Embaralha os estados usando o hash do dia como semente
  const shuffled = [...allStates].sort((a, b) => {
    const hashA = a.charCodeAt(0) * hash;
    const hashB = b.charCodeAt(0) * hash;
    return hashA - hashB;
  });

  // Pega os primeiros 8 estados
  selectedStates.push(...shuffled.slice(0, 8));

  const picked = new Map<string, string>(); // state → city
  for (const state of selectedStates) {
    const citySet = citiesByState.get(state);
    if (!citySet) continue;

    const capital = STATE_CAPITALS[state];
    if (capital && citySet.has(capital)) {
      picked.set(state, capital);
    } else {
      const arr = [...citySet];
      picked.set(state, arr[Math.abs(hash) % arr.length]);
    }
  }

  // Filtra apenas cotações da cidade selecionada por estado
  const sampled = rows.filter((r) => picked.get(r.state) === r.city);

  sampled.sort(
    (a, b) =>
      a.productName.localeCompare(b.productName) ||
      a.state.localeCompare(b.state),
  );
  return sampled;
}

export default async function HomePage() {
  const [allQuotes, news, classifiedsData, subscription] = await Promise.all([
    getTodayQuotes(),
    getLatestNews(6),
    getClassifieds({ limit: 5 }),
    getUserSubscription(),
  ]);

  const planSlug = subscription?.planSlug;
  const showSubscriptionCTA = planSlug !== "ouro";

  const pecuaria = sampleQuotes(
    allQuotes.filter(
      (q) => q.category === "pecuaria" && q.productSlug === "boi-gordo",
    ),
  );
  const graos = sampleQuotes(
    allQuotes.filter((q) => q.category === "graos" && q.productSlug === "soja"),
  );

  // Formata a data real de cada categoria
  function fmtDate(dateStr: string | undefined) {
    if (!dateStr) return "";
    return new Date(`${dateStr}T12:00:00`).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  const graosDate = fmtDate(graos[0]?.quoteDate);
  const pecuariaDate = fmtDate(pecuaria[0]?.quoteDate);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "AgroComm",
    alternateName: "AgroComm Commodities Agropecuárias",
    url: "https://agrocomm.com.br",
    description:
      "Cotações atualizadas de commodities agrícolas e pecuárias: soja, milho, feijão, boi gordo, vaca gorda. Notícias do agronegócio e classificados agrícolas.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://agrocomm.com.br/noticias?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AgroComm",
    url: "https://agrocomm.com.br",
    logo: "https://agrocomm.com.br/images/logo.svg",
    sameAs: [],
    description:
      "Portal de cotações de commodities agropecuárias, notícias do agronegócio e classificados agrícolas.",
  };

  return (
    <main className="max-w-7xl mx-auto p-2 md:px-4">
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }}
      />
      <div className="flex flex-col lg:flex-row gap-4 md:gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">
                Commodities Agropecuárias
              </h1>
              <p className="text-sm text-white/50 mt-1">
                Preços atualizados de soja, milho, feijão, boi gordo e vaca
                gorda
              </p>
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

          {/* Grãos */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white/80">🌾 Soja</h2>
                {graosDate && (
                  <span className="text-xs text-white/30 capitalize">
                    {graosDate}
                  </span>
                )}
              </div>
              <Link
                href="/cotacoes/graos"
                className="text-xs text-green-400 hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <CommoditiesTableClient quotes={graos} title="Saca — Soja" />
          </section>

          {/* Pecuária */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white/80">
                  🐄 Boi Gordo
                </h2>
                {pecuariaDate && (
                  <span className="text-xs text-white/30 capitalize">
                    {pecuariaDate}
                  </span>
                )}
              </div>
              <Link
                href="/cotacoes/pecuaria"
                className="text-xs text-green-400 hover:underline"
              >
                Ver todos →
              </Link>
            </div>
            <CommoditiesTableClient
              quotes={pecuaria}
              title="Arroba — Boi Gordo"
            />
          </section>

          <p className="text-center text-xs text-white/25 mt-2">
            Clique em qualquer linha para ver o gráfico de evolução dos últimos
            30 dias.
          </p>

          {/* News highlights */}
          {news.length > 0 && (
            <section className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/80 flex items-center gap-2">
                  <Newspaper className="w-5 h-5 text-green-400" />
                  Destaques
                </h2>
                <Link
                  href="/noticias"
                  className="text-xs text-green-400 hover:underline flex items-center gap-1"
                >
                  Ver todas <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {news.map((article) => (
                  <Link
                    key={article.id}
                    href={`/noticias/${article.slug}`}
                    className="group flex flex-col bg-white/3 border border-white/10 rounded-xl overflow-hidden hover:border-green-500/20 transition-all duration-300"
                  >
                    {/* Image */}
                    <div className="aspect-video overflow-hidden bg-white/5 relative">
                      {article.imageUrl ? (
                        // biome-ignore lint/performance/noImgElement: external scraped images
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-linear-to-br from-green-900/30 to-emerald-900/20 flex items-center justify-center">
                          <Newspaper className="w-8 h-8 text-green-800/40" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex flex-col gap-2 p-3 grow">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${categoryColors[article.category] ?? categoryColors.geral}`}
                        >
                          {categoryLabels[article.category] ?? article.category}
                        </span>
                        <span className="text-[10px] text-white/25 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>

                      <h3 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-green-300 transition-colors">
                        {article.title}
                      </h3>

                      <span className="mt-auto text-[10px] text-white/20">
                        {article.sourceName}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* Subscription CTA */}
          {showSubscriptionCTA && (
            <section className="relative overflow-hidden rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-900/30 via-emerald-900/20 to-green-950/40">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-green-400/5 via-transparent to-transparent" />
              <div className="relative px-6 py-8 md:px-10 md:py-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
                <div className="flex-1 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-400/10 border border-green-400/20 text-green-400 text-xs font-semibold tracking-wide uppercase mb-4">
                    <Crown className="w-3.5 h-3.5" />
                    {planSlug ? "Faça upgrade" : "Planos AgroComm"}
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold mb-2">
                    {planSlug
                      ? "Desbloqueie todo o potencial"
                      : "Acompanhe o mercado de perto"}
                  </h2>
                  <p className="text-sm text-white/50 max-w-lg">
                    {planSlug
                      ? "Faça upgrade para o plano Ouro e tenha acesso ao histórico completo de preços, boletins diários por e-mail e mais classificados."
                      : "Assine um plano e tenha acesso a histórico de preços, boletins por e-mail, mais classificados e muito mais."}
                  </p>
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-5 text-xs text-white/40">
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-green-400/60" />
                      Histórico de preços
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-green-400/60" />
                      Boletins por e-mail
                    </span>
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-400/60" />
                      Mais classificados
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Link
                    href="/planos"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-green-500 hover:bg-green-400 text-green-950 font-semibold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20"
                  >
                    {planSlug ? "Fazer upgrade" : "Ver planos"}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-5">
            <ClassifiedsSidebar items={classifiedsData.items} />
            <CommoditySidebar />
          </div>
        </div>
      </div>
    </main>
  );
}
