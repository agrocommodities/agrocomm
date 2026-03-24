import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getNewsBySlug,
  getRelatedNews,
  getArticleViewCount,
} from "@/actions/news";
import type { NewsArticle } from "@/actions/news";
import ShareButtons from "@/components/ShareButtons";
import Breadcrumb from "@/components/Breadcrumb";
import {
  Newspaper,
  Clock,
  ExternalLink,
  ArrowRight,
  Tag,
  Eye,
  Users,
} from "lucide-react";
import type { Metadata } from "next";

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
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${day} de ${months[Number(month)]} de ${year}`;
}

function formatDateShort(dateStr: string) {
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) return { title: "Notícia não encontrada" };
  return {
    title: article.title,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: "article",
      publishedTime: article.publishedAt,
      ...(article.imageUrl ? { images: [{ url: article.imageUrl }] } : {}),
    },
    alternates: {
      canonical: `https://agrocomm.com.br/noticias/${slug}`,
    },
  };
}

function RelatedCard({ article }: { article: NewsArticle }) {
  return (
    <Link
      href={`/noticias/${article.slug}`}
      className="group flex gap-4 items-start py-3 border-b border-white/5 last:border-0"
    >
      {article.imageUrl ? (
        <div className="w-20 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0">
          {/* biome-ignore lint/performance/noImgElement: external scraped images */}
          <img
            src={article.imageUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="w-20 h-16 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
          <Newspaper className="w-5 h-5 text-white/20" />
        </div>
      )}
      <div className="min-w-0">
        <h4 className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-green-300 transition-colors">
          {article.title}
        </h4>
        <p className="text-[11px] text-white/30 mt-1">
          {formatDateShort(article.publishedAt)}
        </p>
      </div>
    </Link>
  );
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getNewsBySlug(slug);
  if (!article) notFound();

  const [related, viewCount] = await Promise.all([
    getRelatedNews(article.slug, article.category, 5),
    getArticleViewCount(article.slug),
  ]);
  const articleUrl = `https://agrocomm.com.br/noticias/${article.slug}`;

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            { label: "Notícias", href: "/noticias" },
            { label: article.title },
          ]}
        />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main content */}
        <article className="flex-1 min-w-0">
          {/* Meta */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span
              className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${categoryColors[article.category] ?? categoryColors.geral}`}
            >
              {categoryLabels[article.category] ?? article.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(article.publishedAt)}
            </span>
            <span className="text-xs text-white/20">·</span>
            <span className="text-xs text-white/30">{article.sourceName}</span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight mb-6">
            {article.title}
          </h1>

          {/* Hero image */}
          {article.imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-white/5 mb-6">
              {/* biome-ignore lint/performance/noImgElement: external scraped images */}
              <img
                src={article.imageUrl}
                alt=""
                className="w-full h-full object-cover"
                loading="eager"
              />
            </div>
          )}

          {/* Content */}
          <div className="bg-white/3 border border-white/10 rounded-xl p-6 sm:p-8 mb-6">
            {article.content ? (
              <div
                className="prose prose-invert prose-green max-w-none text-white/70
                  [&_p]:text-base [&_p]:leading-relaxed [&_p]:mb-4
                  [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white/90 [&_h2]:mt-8 [&_h2]:mb-4
                  [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-white/80 [&_h3]:mt-6 [&_h3]:mb-3
                  [&_a]:text-green-400 [&_a]:underline [&_a]:hover:text-green-300
                  [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4
                  [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:mb-4
                  [&_li]:mb-1 [&_li]:text-white/60
                  [&_blockquote]:border-l-4 [&_blockquote]:border-green-500/40 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/50
                  [&_img]:rounded-lg [&_img]:my-4
                  [&_strong]:text-white/90 [&_strong]:font-semibold
                  [&_table]:w-full [&_th]:text-left [&_th]:py-2 [&_td]:py-2 [&_td]:border-b [&_td]:border-white/10"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: sanitized server-side scraped content
                dangerouslySetInnerHTML={{ __html: article.content }}
              />
            ) : (
              <p className="text-base sm:text-lg leading-relaxed text-white/70">
                {article.excerpt}
              </p>
            )}

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs text-white/30">
                <span>Fonte original:</span>
                <span className="font-medium text-white/50">
                  {article.sourceName}
                </span>
              </div>
              <a
                href={article.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors"
              >
                Ler artigo na fonte original
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {article.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/noticias?tag=${tag
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9\s-]/g, "")
                    .replace(/\s+/g, "-")}`}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 hover:border-green-500/30 hover:text-green-300 transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </Link>
              ))}
            </div>
          )}

          {/* Share */}
          <div className="bg-white/3 border border-white/10 rounded-xl p-5">
            <ShareButtons url={articleUrl} title={article.title} />
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:w-80 shrink-0">
          {/* View counter */}
          <div className="bg-white/3 border border-white/10 rounded-xl p-5 mb-4">
            <h3 className="font-bold text-xs uppercase tracking-wider text-white/40 mb-4">
              Estatísticas
            </h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-white/60">
                  <Eye className="w-4 h-4 text-green-400" />
                  Total de visitas
                </span>
                <span className="font-bold tabular-nums">
                  {viewCount.views.toLocaleString("pt-BR")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-white/60">
                  <Users className="w-4 h-4 text-purple-400" />
                  Visitantes únicos
                </span>
                <span className="font-bold tabular-nums">
                  {viewCount.uniqueVisitors.toLocaleString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {related.length > 0 && (
            <div className="bg-white/3 border border-white/10 rounded-xl p-5 lg:sticky lg:top-8">
              <h3 className="font-bold text-sm uppercase tracking-wider text-white/50 mb-4">
                Notícias relacionadas
              </h3>
              <div className="flex flex-col">
                {related.map((r) => (
                  <RelatedCard key={r.id} article={r} />
                ))}
              </div>
              <Link
                href="/noticias"
                className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
              >
                Ver todas as notícias
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
