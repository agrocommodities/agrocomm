import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Mail, MessageCircle, TrendingUp } from "lucide-react";

export default function CommodityBulletinsBanner() {
  return (
    <Link
      href="/planos"
      aria-label="Conhecer os boletins de cotações por e-mail e WhatsApp"
      className="group relative block overflow-hidden rounded-2xl border border-green-400/20 bg-linear-to-br from-[#182017] via-[#202b1d] to-[#394634] p-5 shadow-lg shadow-black/15 transition duration-300 hover:-translate-y-0.5 hover:border-green-400/40 hover:shadow-xl hover:shadow-green-950/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-green-400/20"
    >
      <div className="pointer-events-none absolute -right-12 -top-14 size-36 rounded-full bg-green-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-10 size-28 rounded-full bg-yellow-300/5 blur-3xl" />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="relative flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/7">
              <Image
                src="/images/logo.svg"
                alt=""
                width={30}
                height={30}
                unoptimized
                className="size-7 object-contain"
              />
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-green-400">
                Novidade AgroComm
              </p>
              <p className="mt-0.5 text-sm font-bold text-white/90">
                Boletins de cotações
              </p>
            </div>
          </div>

          <TrendingUp className="size-5 shrink-0 text-green-400/70" />
        </div>

        <div>
          <h2 className="text-lg font-extrabold leading-snug text-white">
            Cotações direto no seu e-mail e WhatsApp
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-white/55">
            A AgroComm agora envia boletins com as commodities que você
            acompanha.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <span className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-xs font-semibold text-white/65">
            <Mail className="size-4 text-green-400" />
            E-mail
          </span>
          <span className="flex items-center gap-2 rounded-xl border border-white/8 bg-black/15 px-3 py-2.5 text-xs font-semibold text-white/65">
            <MessageCircle className="size-4 text-green-400" />
            WhatsApp
          </span>
        </div>

        <span className="inline-flex items-center justify-between gap-3 rounded-xl bg-green-400 px-4 py-3 text-sm font-extrabold text-green-950 transition group-hover:bg-green-300">
          Conhecer os planos
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
