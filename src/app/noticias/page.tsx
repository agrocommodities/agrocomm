import Link from "next/link";
import { getLatestNews } from "@/actions/news";
import type { NewsArticle } from "@/actions/news";
import { Newspaper, ExternalLink, Clock } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 600; // 10 min

export const metadata: Metadata = {
  title: "Notícias Agropecuárias — AgroComm",
  description:
    "Últimas notícias do agronegócio: pecuária, grãos, clima e mercado.",
};

const CATEGORIES = [
  { slug: "geral", label: "Todas", color: "text-white/70" },
  { slug: "graos", label: "Grãos", color: "text-yellow-400" },
  { slug: "pecuaria", label: "Pecuária", color: "text-orange-400" },
  { slug: "clima", label: "Clima", color: "text-blue-400" },
] as const;

type Category = (typeof CATEGORIES)[number]["slug"];

function categoryMeta(slug: string) {
  return CATEGORIES.find((c) => c.slug === slug) ?? CATEGORIES[0];
}

function CategoryBadge({ category }: { category: string }) {
  const meta = categoryMeta(category);
  const colors: Record<string, string> = {
    graos: "bg-yellow-400/10 text-yellow-400 border-yellow-400/20",
    pecuaria: "bg-orange-400/10 text-orange-400 border-orange-400/20",
    clima: "bg-blue-400/10  text-blue-400  border-blue-400/20",
    geral: "bg-white/5     text-white/50  border-white/10",
  };
  return (
    <span
      className={`inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${colors[category] ?? colors.geral}`}
    >
      {meta.label}
    </span>
  );
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col hover:border-white/20 transition-colors">
      {/* Image */}
      {article.imageUrl ? (
        <div className="aspect-[16/9] overflow-hidden bg-white/5 shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {/* biome-ignore lint/performance/noImgElement: imagens externas de scraping */}
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-green-900/30 to-emerald-900/20 flex items-center justify-center shrink-0">
          <Newspaper className="w-10 h-10 text-green-800/50" />
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-3 p-4 grow">
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={article.category} />
          <span className="flex items-center gap-1 text-[11px] text-white/30">
            <Clock className="w-3 h-3" />
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h2 className="font-semibold text-sm leading-snug line-clamp-3 group-hover:text-green-300 transition-colors">
          {article.title}
        </h2>

        {article.excerpt && (
          <p className="text-xs text-white/50 leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
          <span className="text-[11px] text-white/30">
            {article.sourceName}
          </span>
          <a
            href={article.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400 hover:text-green-300 transition-colors"
          >
            Ler mais
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </article>
  );
}

function EmptyState() {
  return (
    <div className="col-span-full flex flex-col items-center justify-center py-20 gap-4 text-center">
      <Newspaper className="w-12 h-12 text-white/20" />
      <div>
        <p className="font-medium text-white/50">Nenhuma notícia disponível</p>
        <p className="text-sm text-white/30 mt-1">
          As notícias são coletadas automaticamente durante o dia.
        </p>
      </div>
    </div>
  );
}

export default async function NoticiasPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const { categoria } = await searchParams;
  const activeCategory = (categoria as Category) ?? "geral";

  const articles = await getLatestNews(40);

  const filtered =
    activeCategory === "geral"
      ? articles
      : articles.filter((a) => a.category === activeCategory);

  // Group by category for "all" view
  const featured = filtered.slice(0, 1);
  const rest = filtered.slice(1);

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Newspaper className="w-7 h-7 text-green-400" />
            Notícias
          </h1>
          <p className="text-white/50 text-sm mt-1">
            Últimas notícias do agronegócio
          </p>
        </div>

        {/* Category filter */}
        <nav className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={
                c.slug === "geral"
                  ? "/noticias"
                  : `/noticias?categoria=${c.slug}`
              }
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                activeCategory === c.slug
                  ? "bg-green-500/20 border-green-500/40 text-green-300"
                  : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
              }`}
            >
              {c.label}
            </Link>
          ))}
        </nav>
      </div>

      {articles.length === 0 ? (
        <div className="grid">
          <EmptyState />
        </div>
      ) : (
        <>
          {/* Featured article (first one) */}
          {featured[0] && (
            <article className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col md:flex-row hover:border-white/20 transition-colors">
              {featured[0].imageUrl ? (
                <div className="md:w-2/5 aspect-[16/9] md:aspect-auto overflow-hidden bg-white/5 shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* biome-ignore lint/performance/noImgElement: imagens externas de scraping */}
                  <img
                    src={featured[0].imageUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="eager"
                  />
                </div>
              ) : (
                <div className="md:w-2/5 aspect-[16/9] md:aspect-auto bg-gradient-to-br from-green-900/30 to-emerald-900/20 flex items-center justify-center shrink-0">
                  <Newspaper className="w-16 h-16 text-green-800/30" />
                </div>
              )}
              <div className="flex flex-col gap-4 p-6 grow">
                <div className="flex items-center gap-2 flex-wrap">
                  <CategoryBadge category={featured[0].category} />
                  <span className="flex items-center gap-1 text-xs text-white/30">
                    <Clock className="w-3 h-3" />
                    {formatDate(featured[0].publishedAt)}
                  </span>
                  <span className="text-xs text-white/30">
                    · {featured[0].sourceName}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold leading-snug group-hover:text-green-300 transition-colors">
                  {featured[0].title}
                </h2>
                {featured[0].excerpt && (
                  <p className="text-sm text-white/60 leading-relaxed line-clamp-4">
                    {featured[0].excerpt}
                  </p>
                )}
                <div className="mt-auto">
                  <a
                    href={featured[0].sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
                  >
                    Ler artigo completo
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </article>
          )}

          {/* Grid of remaining articles */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rest.map((article) => (
                <NewsCard key={article.id} article={article} />
              ))}
            </div>
          )}

          {filtered.length === 0 && (
            <div className="grid">
              <EmptyState />
            </div>
          )}
        </>
      )}

      <p className="text-center text-xs text-white/25">
        Notícias coletadas automaticamente de fontes do agronegócio.
      </p>
    </main>
  );
}
