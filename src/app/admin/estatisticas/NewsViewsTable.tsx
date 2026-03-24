import Link from "next/link";
import { Newspaper, Eye, Users, ChevronLeft, ChevronRight } from "lucide-react";

const categoryLabels: Record<string, string> = {
  graos: "Grãos",
  pecuaria: "Pecuária",
  clima: "Clima",
  geral: "Geral",
};

const categoryColors: Record<string, string> = {
  graos: "text-yellow-400 bg-yellow-400/10",
  pecuaria: "text-orange-400 bg-orange-400/10",
  clima: "text-blue-400 bg-blue-400/10",
  geral: "text-white/50 bg-white/5",
};

interface Article {
  id: number;
  title: string;
  slug: string;
  category: string;
  publishedAt: string;
  views: number;
  uniqueVisitors: number;
}

interface Props {
  articles: Article[];
  total: number;
  page: number;
  limit: number;
}

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
}

export default function NewsViewsTable({
  articles,
  total,
  page,
  limit,
}: Props) {
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-white/40" />
          <h2 className="font-semibold text-sm text-white/70">
            Notícias com Visitas
          </h2>
          <span className="text-xs text-white/30 bg-white/5 px-2 py-0.5 rounded-full">
            {total} {total === 1 ? "artigo" : "artigos"}
          </span>
        </div>
        {totalPages > 1 && (
          <span className="text-xs text-white/30">
            {start}–{end} de {total}
          </span>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="px-5 py-12 text-center text-white/30 text-sm">
          Nenhuma notícia com visitas registradas
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white/40 text-xs uppercase tracking-wide border-b border-white/5">
                <th className="text-left px-5 py-3 font-medium">Título</th>
                <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                  Categoria
                </th>
                <th className="text-left px-5 py-3 font-medium hidden md:table-cell">
                  Publicação
                </th>
                <th className="text-right px-5 py-3 font-medium">
                  <span className="flex items-center justify-end gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Visitas
                  </span>
                </th>
                <th className="text-right px-5 py-3 font-medium hidden sm:table-cell">
                  <span className="flex items-center justify-end gap-1">
                    <Users className="w-3.5 h-3.5" />
                    Únicos
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr
                  key={article.id}
                  className="border-t border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-5 py-3">
                    <Link
                      href={`/noticias/${article.slug}`}
                      target="_blank"
                      className="text-white/80 hover:text-green-300 transition-colors line-clamp-1 font-medium"
                    >
                      {article.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 hidden sm:table-cell">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${categoryColors[article.category] ?? categoryColors.geral}`}
                    >
                      {categoryLabels[article.category] ?? article.category}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-white/40 text-xs hidden md:table-cell">
                    {formatDate(article.publishedAt)}
                  </td>
                  <td className="px-5 py-3 text-right font-bold tabular-nums">
                    {article.views.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-5 py-3 text-right text-white/50 tabular-nums hidden sm:table-cell">
                    {article.uniqueVisitors.toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="px-5 py-4 border-t border-white/10 flex items-center justify-between gap-4">
          <Link
            href={`?newsPage=${Math.max(1, page - 1)}`}
            aria-disabled={page <= 1}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
              ${page <= 1 ? "border-white/5 text-white/20 pointer-events-none" : "border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-300"}`}
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            Anterior
          </Link>
          <span className="text-xs text-white/30">
            Página {page} de {totalPages}
          </span>
          <Link
            href={`?newsPage=${Math.min(totalPages, page + 1)}`}
            aria-disabled={page >= totalPages}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
              ${page >= totalPages ? "border-white/5 text-white/20 pointer-events-none" : "border-white/10 text-white/60 hover:border-green-500/40 hover:text-green-300"}`}
          >
            Próxima
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}
