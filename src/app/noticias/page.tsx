import Link from "next/link";
import { getLatestNews, getTagCloud, getNewsByTag } from "@/actions/news";
import type { NewsArticle } from "@/actions/news";
import { Newspaper, Clock, ArrowRight, Tag } from "lucide-react";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Notícias Agropecuárias — AgroComm",
  description:
    "Últimas notícias do agronegócio: pecuária, grãos, clima e mercado.",
};

const CATEGORIES = [
  { slug: "geral", label: "Todas" },
  { slug: "graos", label: "Grãos" },
  { slug: "pecuaria", label: "Pecuária" },
  { slug: "clima", label: "Clima" },
] as const;

type Category = (typeof CATEGORIES)[number]["slug"];

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

function CategoryBadge({ category }: { category: string }) {
  return (
    <span
      className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryColors[category] ?? categoryColors.geral}`}
    >
      {categoryLabels[category] ?? category}
    </span>
  );
}

function FeaturedCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="group block bg-white/3 border border-white/10 rounded-2xl overflow-hidden hover:border-green-500/30 transition-all duration-300"
    >
      <div className="flex flex-col lg:flex-row">
        {/* Image */}
        <div className="lg:w-3/5 aspect-video lg:aspect-auto lg:min-h-80 overflow-hidden bg-white/5 relative">
          {article.imageUrl ? (
            // biome-ignore lint/performance/noImgElement: external scraped images
            <img
              src={article.imageUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              loading="eager"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-green-900/40 to-emerald-900/20 flex items-center justify-center">
              <Newspaper className="w-16 h-16 text-green-800/40" />
            </div>
          )}
          <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent lg:bg-linear-to-r lg:from-transparent lg:to-black/20" />
        </div>

        {/* Content */}
        <div className="lg:w-2/5 flex flex-col justify-center gap-4 p-6 lg:p-8">
          <div className="flex items-center gap-3">
            <CategoryBadge category={article.category} />
            <span className="text-xs text-white/30">{article.sourceName}</span>
          </div>

          <h2 className="text-xl sm:text-2xl lg:text-2xl font-bold leading-snug group-hover:text-green-300 transition-colors">
            {article.title}
          </h2>

          {article.excerpt && (
            <p className="text-sm text-white/50 leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-green-400 group-hover:text-green-300 transition-colors">
              Ler mais
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <Link
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
      <div className="flex flex-col gap-2.5 p-4 grow">
        <div className="flex items-center gap-2">
          <CategoryBadge category={article.category} />
          <span className="text-[11px] text-white/25">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h3 className="font-semibold text-sm leading-snug line-clamp-3 group-hover:text-green-300 transition-colors">
          {article.title}
        </h3>

        {article.excerpt && (
          <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
            {article.excerpt}
          </p>
        )}

        <div className="mt-auto pt-1 flex items-center justify-between">
          <span className="text-[11px] text-white/25">
            {article.sourceName}
          </span>
          <span className="text-xs font-medium text-green-400/70 group-hover:text-green-400 transition-colors flex items-center gap-1">
            Ler
            <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function CompactCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="group flex gap-4 items-start py-4 border-b border-white/5 last:border-0 hover:bg-white/2 -mx-2 px-2 rounded-lg transition-colors"
    >
      {article.imageUrl ? (
        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white/5 shrink-0">
          {/* biome-ignore lint/performance/noImgElement: external scraped images */}
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Newspaper className="w-5 h-5 text-white/20" />
        </div>
      )}
      <div className="flex flex-col gap-1 min-w-0">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-green-300 transition-colors">
          {article.title}
        </h4>
        <div className="flex items-center gap-2 text-[11px] text-white/30">
          <CategoryBadge category={article.category} />
          <span>{formatDate(article.publishedAt)}</span>
        </div>
      </div>
    </Link>
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
  searchParams: Promise<{ categoria?: string; tag?: string }>;
}) {
  const { categoria, tag: tagSlug } = await searchParams;
  const activeCategory = (categoria as Category) ?? "geral";

  const [tagCloud] = await Promise.all([getTagCloud()]);

  let articles: NewsArticle[];
  if (tagSlug) {
    articles = await getNewsByTag(tagSlug, 40);
  } else {
    articles = await getLatestNews(40);
  }

  const filtered =
    !tagSlug && activeCategory !== "geral"
      ? articles.filter((a) => a.category === activeCategory)
      : articles;

  const featured = filtered[0];
  const secondary = filtered.slice(1, 4);
  const rest = filtered.slice(4);

  // Find the current tag name
  const currentTag = tagSlug
    ? (tagCloud.find((t) => t.slug === tagSlug)?.name ?? tagSlug)
    : null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <div className="flex-1 min-w-0 flex flex-col gap-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
                <Newspaper className="w-8 h-8 text-green-400" />
                {currentTag ? `Notícias: ${currentTag}` : "Notícias"}
              </h1>
              <p className="text-white/40 text-sm mt-1.5">
                {currentTag
                  ? `${filtered.length} notícias com a tag "${currentTag}"`
                  : "Acompanhe as últimas notícias do agronegócio brasileiro"}
              </p>
            </div>

            {/* Category filter */}
            <nav className="flex gap-2 flex-wrap">
              {currentTag && (
                <Link
                  href="/noticias"
                  className="text-xs font-semibold px-4 py-2 rounded-full border bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all"
                >
                  ✕ Limpar filtro
                </Link>
              )}
              {!currentTag &&
                CATEGORIES.map((c) => (
                  <Link
                    key={c.slug}
                    href={
                      c.slug === "geral"
                        ? "/noticias"
                        : `/noticias?categoria=${c.slug}`
                    }
                    className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all duration-200 ${
                      activeCategory === c.slug
                        ? "bg-green-500/20 border-green-500/40 text-green-300 shadow-sm shadow-green-500/10"
                        : "bg-white/5 border-white/10 text-white/50 hover:border-white/20 hover:text-white/70"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
            </nav>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10" />

          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              {/* Featured */}
              {featured && <FeaturedCard article={featured} />}

              {/* Secondary grid */}
              {secondary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {secondary.map((article) => (
                    <NewsCard key={article.id} article={article} />
                  ))}
                </div>
              )}

              {/* Divider */}
              {rest.length > 0 && <div className="h-px bg-white/10" />}

              {/* Remaining articles */}
              {rest.length > 0 && (
                <section>
                  <h2 className="text-lg font-bold mb-4 text-white/70">
                    Mais notícias
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                    {rest.map((article) => (
                      <CompactCard key={article.id} article={article} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <p className="text-center text-xs text-white/20 pt-4">
            Notícias coletadas automaticamente de fontes do agronegócio.
          </p>
        </div>

        {/* Tag Cloud Sidebar */}
        {tagCloud.length > 0 && (
          <aside className="lg:w-72 shrink-0">
            <div className="bg-white/3 border border-white/10 rounded-xl p-5 lg:sticky lg:top-20">
              <h3 className="font-bold text-sm uppercase tracking-wider text-white/50 mb-4 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h3>
              <div className="flex flex-wrap gap-2">
                {tagCloud.map((t) => {
                  const maxCount = Math.max(...tagCloud.map((tc) => tc.count));
                  const ratio = t.count / maxCount;
                  const size =
                    ratio > 0.7
                      ? "text-sm"
                      : ratio > 0.4
                        ? "text-xs"
                        : "text-[11px]";
                  const opacity =
                    ratio > 0.7
                      ? "text-white/80"
                      : ratio > 0.4
                        ? "text-white/60"
                        : "text-white/40";

                  return (
                    <Link
                      key={t.slug}
                      href={`/noticias?tag=${t.slug}`}
                      className={`inline-block px-2.5 py-1 rounded-full border transition-all duration-200 ${
                        tagSlug === t.slug
                          ? "bg-green-500/20 border-green-500/40 text-green-300"
                          : `bg-white/5 border-white/10 ${opacity} hover:border-green-500/30 hover:text-green-300`
                      } ${size} font-medium`}
                      title={`${t.count} notícia${t.count > 1 ? "s" : ""}`}
                    >
                      {t.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}
