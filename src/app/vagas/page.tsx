import Link from "next/link";
import { getJobListings, getStatesForJobs } from "@/actions/jobs";
import { getSession } from "@/lib/auth";
import {
  Search,
  Plus,
  MapPin,
  Briefcase,
  UserSearch,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Clock3,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { JOB_AREAS, contractTypeLabel, availabilityLabel } from "@/lib/jobs";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Vagas de Emprego — AgroComm",
  description:
    "Vagas de emprego no agronegócio: encontre oportunidades ou anuncie sua vaga para o campo, pecuária, agroindústria e mais.",
  openGraph: {
    title: "Vagas de Emprego — AgroComm",
    description: "Encontre oportunidades ou anuncie vagas para o agronegócio.",
  },
  alternates: {
    canonical: "https://agrocomm.com.br/vagas",
  },
};

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

export default async function VagasPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const session = await getSession();
  const type = params.tipo === "candidato" ? "candidato" : "oferta";
  const area = params.area;
  const state = params.estado;
  const search = params.busca;
  const page = Number(params.pagina ?? "1");

  const [data, statesList] = await Promise.all([
    getJobListings({ type, area, stateCode: state, search, page }),
    getStatesForJobs(),
  ]);

  function buildUrl(overrides: Record<string, string | undefined>) {
    const p = new URLSearchParams();
    const merged = {
      tipo: type,
      area,
      estado: state,
      busca: search,
      ...overrides,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v) p.set(k, v);
    }
    const qs = p.toString();
    return qs ? `/vagas?${qs}` : "/vagas";
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Breadcrumb items={[{ label: "Vagas de Emprego" }]} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vagas de Emprego</h1>
          <p className="text-sm text-white/50 mt-1">
            {data.total} publicação{data.total !== 1 && "ões"} no agronegócio
          </p>
        </div>
        {session && (
          <Link
            href={`/vagas/nova?tipo=${type}`}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Publicar
          </Link>
        )}
      </div>

      {/* Type tabs */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Link
          href={buildUrl({ tipo: "oferta", pagina: undefined })}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border transition ${
            type === "oferta"
              ? "bg-green-600/20 text-green-400 border-green-400/30"
              : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
          }`}
        >
          <Briefcase className="w-4 h-4" />
          Vagas Oferecidas
        </Link>
        <Link
          href={buildUrl({ tipo: "candidato", pagina: undefined })}
          className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border transition ${
            type === "candidato"
              ? "bg-green-600/20 text-green-400 border-green-400/30"
              : "bg-white/5 text-white/50 border-white/10 hover:border-white/30"
          }`}
        >
          <UserSearch className="w-4 h-4" />
          Procuram Emprego
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6">
        <form method="GET" action="/vagas" className="flex flex-col gap-3">
          <input type="hidden" name="tipo" value={type} />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              name="busca"
              defaultValue={search}
              placeholder="Buscar por título..."
              className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              name="area"
              defaultValue={area ?? ""}
              className="flex-1 bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50"
            >
              <option value="">Todas as áreas</option>
              {JOB_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>

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
      {(area || state || search) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {area && (
            <Link
              href={buildUrl({ area: undefined, pagina: undefined })}
              className="flex items-center gap-1 bg-green-600/20 text-green-400 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-green-600/30 transition"
            >
              {area}
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
            href={`/vagas?tipo=${type}`}
            className="text-xs text-white/40 hover:text-white underline px-2 py-1.5"
          >
            Limpar filtros
          </Link>
        </div>
      )}

      {/* Grid */}
      {data.items.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          <p className="text-lg mb-2">Nenhuma publicação encontrada</p>
          <p className="text-sm">
            Tente ajustar os filtros ou publique a primeira vaga.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((item) => (
            <Link
              key={item.id}
              href={`/vagas/${item.slug}`}
              className="group bg-white/3 border border-white/10 rounded-2xl hover:border-green-500/30 transition-all duration-300 p-4"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-400/20">
                  {item.area}
                </span>
                <span className="text-[10px] text-white/40 shrink-0">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
              <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-green-300 transition-colors">
                {item.title}
              </h3>
              {item.type === "oferta" ? (
                <p className="text-xs text-white/50 mb-2 line-clamp-1">
                  {item.companyName}
                </p>
              ) : (
                <p className="text-xs text-white/50 mb-2 line-clamp-1">
                  {item.desiredRole}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-xs text-white/40 mb-2">
                {item.type === "oferta" && item.contractType && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {contractTypeLabel(item.contractType)}
                  </span>
                )}
                {item.type === "oferta" && item.salaryRange && (
                  <span className="flex items-center gap-1">
                    <Wallet className="w-3 h-3" />
                    {item.salaryRange}
                  </span>
                )}
                {item.type === "candidato" && item.experienceYears != null && (
                  <span>{item.experienceYears} anos de experiência</span>
                )}
                {item.type === "candidato" && item.availability && (
                  <span className="flex items-center gap-1">
                    <Clock3 className="w-3 h-3" />
                    {availabilityLabel(item.availability)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1 text-xs text-white/40">
                <MapPin className="w-3 h-3" />
                {item.cityName}, {item.stateCode}
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
            Quer publicar uma vaga ou se candidatar?
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
