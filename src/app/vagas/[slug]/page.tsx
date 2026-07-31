import { notFound } from "next/navigation";
import Link from "next/link";
import { getJobListingBySlug } from "@/actions/jobs";
import { getSession } from "@/lib/auth";
import {
  MapPin,
  Clock,
  ChevronLeft,
  Briefcase,
  UserSearch,
  Wallet,
  Users,
  Clock3,
  Phone,
  Mail,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import JobListingOwnerActions from "@/components/JobListingOwnerActions";
import MarkdownContent from "@/components/MarkdownContent";
import { contractTypeLabel, availabilityLabel } from "@/lib/jobs";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getJobListingBySlug(slug);
  if (!item) return { title: "Publicação não encontrada" };
  return {
    title: `${item.title} — Vagas de Emprego`,
    description: item.description?.slice(0, 160),
    openGraph: {
      title: item.title,
      description: item.description?.slice(0, 160),
      type: "article",
    },
    alternates: {
      canonical: `https://agrocomm.com.br/vagas/${slug}`,
    },
  };
}

function formatDate(dateStr: string) {
  const normalized = dateStr.includes("T")
    ? dateStr
    : `${dateStr.replace(" ", "T")}Z`;
  return new Date(normalized).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default async function JobListingDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getJobListingBySlug(slug);
  if (!item) notFound();

  const session = await getSession();
  const isOwner = session?.userId === item.userId;

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Vagas de Emprego", href: "/vagas" },
          { label: item.title },
        ]}
      />

      {/* Status banner */}
      {item.status !== "approved" && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            item.status === "pending"
              ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
              : item.status === "paused"
                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {item.status === "pending" &&
            "⏳ Aguardando aprovação do administrador"}
          {item.status === "paused" &&
            "⏸️ Publicação pausada — não visível para outros usuários"}
          {item.status === "rejected" && "❌ Publicação rejeitada"}
          {item.status === "blocked" && "🚫 Publicação bloqueada"}
        </div>
      )}

      {/* Owner actions */}
      {isOwner && (
        <div className="mb-4">
          <JobListingOwnerActions
            jobId={item.id}
            slug={item.slug}
            status={item.status}
          />
        </div>
      )}

      <div className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-6">
        {/* Type + Area + Date */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-400/20">
            {item.type === "oferta" ? (
              <Briefcase className="w-3 h-3" />
            ) : (
              <UserSearch className="w-3 h-3" />
            )}
            {item.area}
          </span>
          <span className="flex items-center gap-1 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            {formatDate(item.createdAt)}
          </span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-bold mb-1">{item.title}</h1>
        {item.type === "oferta" ? (
          <p className="text-sm text-white/60 mb-4">{item.companyName}</p>
        ) : (
          <p className="text-sm text-white/60 mb-4">{item.desiredRole}</p>
        )}

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-white/60 mb-4">
          <MapPin className="w-4 h-4 text-white/40" />
          {item.cityName}, {item.stateName}
        </div>

        {/* Key facts */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-white/70 mb-6">
          {item.type === "oferta" && item.contractType && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-white/40" />
              {contractTypeLabel(item.contractType)}
            </span>
          )}
          {item.type === "oferta" && item.salaryRange && (
            <span className="flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-white/40" />
              {item.salaryRange}
            </span>
          )}
          {item.type === "oferta" && item.positionsCount != null && (
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-white/40" />
              {item.positionsCount} vaga{item.positionsCount !== 1 && "s"}
            </span>
          )}
          {item.type === "candidato" && item.experienceYears != null && (
            <span className="flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-white/40" />
              {item.experienceYears} anos de experiência
            </span>
          )}
          {item.type === "candidato" && item.availability && (
            <span className="flex items-center gap-1.5">
              <Clock3 className="w-4 h-4 text-white/40" />
              Disponibilidade: {availabilityLabel(item.availability)}
            </span>
          )}
        </div>

        {/* Description */}
        {item.description && (
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Descrição
            </h2>
            <MarkdownContent
              content={item.description}
              className="text-sm text-white/80 leading-relaxed markdown-preview"
            />
          </div>
        )}

        {item.type === "oferta" && item.requirements && (
          <div className="border-t border-white/10 pt-6 mt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Requisitos
            </h2>
            <MarkdownContent
              content={item.requirements}
              className="text-sm text-white/80 leading-relaxed markdown-preview"
            />
          </div>
        )}

        {item.type === "oferta" && item.benefits && (
          <div className="border-t border-white/10 pt-6 mt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Benefícios
            </h2>
            <MarkdownContent
              content={item.benefits}
              className="text-sm text-white/80 leading-relaxed markdown-preview"
            />
          </div>
        )}

        {item.type === "candidato" && item.skills && (
          <div className="border-t border-white/10 pt-6 mt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Habilidades e experiências
            </h2>
            <MarkdownContent
              content={item.skills}
              className="text-sm text-white/80 leading-relaxed markdown-preview"
            />
          </div>
        )}

        {/* Contact */}
        <div className="border-t border-white/10 pt-6 mt-6">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
            Contato
          </h2>
          <p className="text-sm font-medium mb-2">{item.userName}</p>
          {session ? (
            <div className="flex flex-col gap-1.5">
              {item.contactPhone && (
                <a
                  href={`https://wa.me/55${item.contactPhone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {item.contactPhone}
                </a>
              )}
              {item.contactEmail && (
                <a
                  href={`mailto:${item.contactEmail}`}
                  className="flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {item.contactEmail}
                </a>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm mt-2"
            >
              Faça login para ver o contato
            </Link>
          )}
        </div>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/vagas"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar às vagas
        </Link>
      </div>
    </div>
  );
}
