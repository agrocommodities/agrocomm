import Link from "next/link";
import { getTodayQuotes } from "@/actions/quotes";
import { getLatestNews } from "@/actions/news";
import CommoditiesTableClient from "@/components/CommoditiesTableClient";
import CommoditySidebar from "@/components/CommoditySidebar";
import { Clock, ArrowRight, Newspaper } from "lucide-react";

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

export default async function HomePage() {
  const [allQuotes, news] = await Promise.all([
    getTodayQuotes(),
    getLatestNews(6),
  ]);

  const pecuaria = allQuotes.filter((q) => q.category === "pecuaria");
  const graos = allQuotes.filter((q) => q.category === "graos");

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

  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-10">
          {/* Hero */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold">Cotações do Dia</h1>
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
                <h2 className="text-lg font-semibold text-white/80">
                  🌾 Grãos
                </h2>
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
            <CommoditiesTableClient
              quotes={graos}
              title="Saca — Soja, Milho & Feijão"
            />
          </section>

          {/* Pecuária */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold text-white/80">
                  🐄 Pecuária
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
              title="Arroba — Boi & Vaca"
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
        </div>

        {/* Sidebar */}
        <div className="lg:w-72 shrink-0">
          <div className="lg:sticky lg:top-20 flex flex-col gap-5">
            <CommoditySidebar />
          </div>
        </div>
      </div>
    </main>
  );
}
