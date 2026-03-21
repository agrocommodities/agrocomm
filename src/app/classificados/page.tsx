import Link from "next/link";
import {
  getClassifieds,
  getClassifiedCategories,
  getStatesForClassifieds,
} from "@/actions/classifieds";
import { getSession } from "@/lib/auth";
import {
  Search,
  Plus,
  MapPin,
  Tag,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Classificados Agrícolas — Tratores, Máquinas e Implementos",
  description:
    "Classificados de máquinas agrícolas, tratores, caminhões, implementos, gado e fazendas. Compre e venda equipamentos para o agronegócio.",
  openGraph: {
    title: "Classificados Agrícolas — Tratores, Máquinas e Implementos",
    description:
      "Compre e venda tratores, máquinas agrícolas, implementos, gado e fazendas.",
  },
  alternates: {
    canonical: "https://agrocomm.com.br/classificados",
  },
};

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function timeAgo(dateStr: string) {
  const normalized = dateStr.includes("T")
    ? dateStr
    : `${dateStr.replace(" ", "T")}Z`;
  const now = Date.now();
  const date = new Date(normalized).getTime();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

export default async function ClassificadosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const category = params.categoria;
  const state = params.estado;
  const search = params.busca;
  const page = Number(params.pagina ?? "1");

  const [data, categories, statesList] = await Promise.all([
    getClassifieds({ categorySlug: category, stateCode: state, search, page }),
    getClassifiedCategories(),
    getStatesForClassifieds(),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      categoria: category,
      estado: state,
      busca: search,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/classificados?${qs}` : "/classificados";
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Classificados" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Classificados</h1>
          <p className="text-sm text-white/50 mt-1">
            {data.total} anúncio{data.total !== 1 && "s"}
          </p>
        </div>
        {session && (
          <Link
            href="/classificados/novo"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Publicar Anúncio
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <form
          method="GET"
          action="/classificados"
          className="flex flex-col gap-3"
        >
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              name="busca"
              defaultValue={search}
              placeholder="Buscar anúncios..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Category filter */}
            <select
              name="categoria"
              defaultValue={category ?? ""}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* State filter */}
            <select
              name="estado"
              defaultValue={state ?? ""}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              <option value="">Todos os estados</option>
              {statesList.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
            >
              Filtrar
            </button>
          </div>
        </form>
      </div>

      {/* Active filters */}
      {(category || state || search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {category && (
            <Link
              href={buildUrl({ categoria: undefined, pagina: undefined })}
              className="flex items-center gap-1 bg-green-600/20 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-green-600/30 transition"
            >
              <Tag className="w-3 h-3" />
              {categories.find((c) => c.slug === category)?.name ?? category}
              <span className="ml-1">×</span>
            </Link>
          )}
          {state && (
            <Link
              href={buildUrl({ estado: undefined, pagina: undefined })}
              className="flex items-center gap-1 bg-blue-600/20 text-blue-400 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-blue-600/30 transition"
            >
              <MapPin className="w-3 h-3" />
              {statesList.find((s) => s.code === state)?.name ?? state}
              <span className="ml-1">×</span>
            </Link>
          )}
          {search && (
            <Link
              href={buildUrl({ busca: undefined, pagina: undefined })}
              className="flex items-center gap-1 bg-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-white/20 transition"
            >
              <Search className="w-3 h-3" />
              &quot;{search}&quot;
              <span className="ml-1">×</span>
            </Link>
          )}
          <Link
            href="/classificados"
            className="text-xs text-white/40 hover:text-white underline px-2 py-1.5"
          >
            Limpar filtros
          </Link>
        </div>
      )}

      {/* Categories quick access */}
      <div className="flex overflow-x-auto md:overflow-x-scroll gap-2 pb-2 mb-6">
        <Link
          href="/classificados"
          className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
            !category
              ? "bg-green-600/20 text-green-400 border-green-400/30"
              : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
          }`}
        >
          Todos
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={buildUrl({ categoria: c.slug, pagina: undefined })}
            className={`shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border transition ${
              category === c.slug
                ? "bg-green-600/20 text-green-400 border-green-400/30"
                : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {data.items.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg mb-2">Nenhum anúncio encontrado</p>
          <p className="text-sm">
            Tente ajustar os filtros ou publique o primeiro anúncio.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((item) => (
            <Link
              key={item.id}
              href={`/classificados/${item.slug}`}
              className="group bg-white/3 border border-white/10 rounded-2xl hover:border-green-500/30 transition-all duration-300"
            >
              {/* Image */}
              <div className="aspect-4/3 bg-white/5 rounded-t-2xl overflow-hidden">
                {item.images[0] ? (
                  // biome-ignore lint/performance/noImgElement: user uploaded images
                  <img
                    src={item.images[0].url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20 text-sm">
                    Sem imagem
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-400/20">
                    {item.categoryName}
                  </span>
                  <span className="text-[10px] text-white/40 shrink-0">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-green-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-lg font-bold text-green-400 mb-2">
                  {formatPrice(item.price)}
                </p>
                <div className="flex items-center gap-1 text-xs text-white/40">
                  <MapPin className="w-3 h-3" />
                  {item.cityName}, {item.stateCode}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link
              href={buildUrl({ pagina: String(page - 1) })}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Link>
          )}
          <span className="text-sm text-white/50">
            {page} / {data.totalPages}
          </span>
          {page < data.totalPages && (
            <Link
              href={buildUrl({ pagina: String(page + 1) })}
              className="flex items-center gap-1 text-sm px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition"
            >
              Próxima
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      )}

      {/* CTA for non-logged users */}
      {!session && (
        <div className="text-center mt-8 py-6 bg-white/3 border border-white/10 rounded-2xl">
          <p className="text-sm text-white/50 mb-3">
            Quer publicar um anúncio?
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-6 py-2.5 rounded-lg transition-colors"
          >
            Faça login
          </Link>
        </div>
      )}
    </div>
  );
}
