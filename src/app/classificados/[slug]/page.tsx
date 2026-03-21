import { notFound } from "next/navigation";
import Link from "next/link";
import { getClassifiedBySlug } from "@/actions/classifieds";
import { getSession } from "@/lib/auth";
import {
  MapPin,
  Clock,
  Tag,
  ChevronLeft,
  MessageCircle,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import ClassifiedGallery from "@/components/ClassifiedGallery";
import ClassifiedComments from "@/components/ClassifiedComments";
import ClassifiedOwnerActions from "@/components/ClassifiedOwnerActions";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const item = await getClassifiedBySlug(slug);
  if (!item) return { title: "Anúncio não encontrado" };
  return {
    title: `${item.title} — Classificados`,
    description: item.description.slice(0, 160),
    openGraph: {
      title: item.title,
      description: item.description.slice(0, 160),
      type: "article",
    },
    alternates: {
      canonical: `https://agrocomm.com.br/classificados/${slug}`,
    },
  };
}

function formatPrice(price: number) {
  return price.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

export default async function ClassifiedDetailPage({ params }: Props) {
  const { slug } = await params;
  const item = await getClassifiedBySlug(slug);
  if (!item) notFound();

  const session = await getSession();

  return (
    <div className="max-w-4xl mx-auto">
      <Breadcrumb
        items={[
          { label: "Classificados", href: "/classificados" },
          {
            label: item.categoryName,
            href: `/classificados?categoria=${item.categorySlug}`,
          },
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
                : item.status === "rejected"
                  ? "bg-red-500/10 text-red-400 border border-red-500/20"
                  : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}
        >
          {item.status === "pending" &&
            "⏳ Aguardando aprovação do administrador"}
          {item.status === "paused" &&
            "⏸️ Anúncio pausado — não visível para outros usuários"}
          {item.status === "rejected" && "❌ Anúncio rejeitado"}
          {item.status === "blocked" && "🚫 Anúncio bloqueado"}
        </div>
      )}

      {/* Owner actions */}
      {session && session.userId === item.userId && (
        <div className="mb-4">
          <ClassifiedOwnerActions
            classifiedId={item.id}
            slug={item.slug}
            status={item.status}
          />
        </div>
      )}

      <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
        {/* Gallery */}
        <ClassifiedGallery images={item.images} title={item.title} />

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Category + Date */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <Link
              href={`/classificados?categoria=${item.categorySlug}`}
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-green-600/20 text-green-400 border border-green-400/20 hover:bg-green-600/30 transition"
            >
              <Tag className="w-3 h-3" />
              {item.categoryName}
            </Link>
            <span className="flex items-center gap-1 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              {formatDate(item.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-xl sm:text-2xl font-bold mb-4">{item.title}</h1>

          {/* Price */}
          <div className="text-2xl sm:text-3xl font-bold text-green-400 mb-1">
            {formatPrice(item.price)}
          </div>
          {item.previousPrice != null &&
            item.previousPrice !== item.price &&
            (() => {
              const diff = item.price - item.previousPrice;
              const pct = (diff / item.previousPrice) * 100;
              const isUp = diff > 0;
              return (
                <div
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full mb-4 ${
                    isUp
                      ? "bg-red-500/10 text-red-400 border border-red-500/20"
                      : "bg-green-500/10 text-green-400 border border-green-500/20"
                  }`}
                >
                  {isUp ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {isUp ? "Subiu" : "Desceu"} {formatPrice(Math.abs(diff))} (
                    {isUp ? "+" : ""}
                    {pct.toFixed(1)}%)
                  </span>
                  <span className="text-white/30">
                    — antes: {formatPrice(item.previousPrice)}
                  </span>
                </div>
              );
            })()}
          {!(
            item.previousPrice != null && item.previousPrice !== item.price
          ) && <div className="mb-4" />}

          {/* Location */}
          <div className="flex items-center gap-2 text-sm text-white/60 mb-6">
            <MapPin className="w-4 h-4 text-white/40" />
            {item.cityName}, {item.stateName}
          </div>

          {/* Negotiate button */}
          <div className="mb-6">
            {session ? (
              <Link
                href={`https://wa.me/?text=${encodeURIComponent(`Olá! Vi seu anúncio "${item.title}" no AgroComm e tenho interesse. Link: ${process.env.NEXT_PUBLIC_BASE_URL ?? "https://agrocomm.com.br"}/classificados/${item.slug}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                <MessageCircle className="w-5 h-5" />
                Negociar
              </Link>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Faça login para negociar
              </Link>
            )}
          </div>

          {/* Description */}
          <div className="border-t border-white/10 pt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-3">
              Descrição
            </h2>
            <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">
              {item.description}
            </p>
          </div>

          {/* Seller info */}
          <div className="border-t border-white/10 pt-6 mt-6">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-2">
              Anunciante
            </h2>
            <p className="text-sm font-medium">{item.userName}</p>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="mt-6">
        <ClassifiedComments
          classifiedId={item.id}
          comments={item.comments}
          isLoggedIn={!!session}
          currentUserId={session?.userId}
        />
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          href="/classificados"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Voltar aos classificados
        </Link>
      </div>
    </div>
  );
}
