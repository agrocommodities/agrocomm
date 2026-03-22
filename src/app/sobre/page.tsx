import Link from "next/link";
import {
  Info,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Newspaper,
  Globe2,
  ShoppingCart,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre — AgroComm",
  description:
    "Conheça a AgroComm, plataforma de cotações de commodities agropecuárias.",
};

export default function SobrePage() {
  return (
    <main className="max-w-4xl mx-auto flex flex-col gap-10">
      <div>
        <Breadcrumb items={[{ label: "Sobre" }]} />
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 mt-1">
          <Info className="w-8 h-8 text-green-400" />
          Sobre a AgroComm
        </h1>
        <p className="text-white/50 mt-2 text-sm">
          Plataforma de cotações e informações do agronegócio brasileiro
        </p>
      </div>

      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <div className="text-white/70 space-y-4 text-sm leading-relaxed">
          <p className="text-base text-white/90">
            A <strong className="text-green-300">AgroComm</strong> é uma
            plataforma digital dedicada a reunir, organizar e apresentar
            cotações de commodities agropecuárias do mercado brasileiro de forma
            acessível e atualizada.
          </p>

          <p>
            Nosso objetivo é democratizar o acesso à informação do agronegócio,
            permitindo que produtores rurais, investidores, estudantes e
            qualquer pessoa interessada possam acompanhar os preços de soja,
            milho, feijão, boi gordo e vaca gorda em dezenas de cidades e
            estados do Brasil.
          </p>

          <p>
            Os dados são coletados automaticamente de fontes confiáveis do
            mercado, e atualizados múltiplas vezes ao dia durante os dias úteis.
          </p>
        </div>
      </section>

      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-5">O que oferecemos</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 flex gap-3">
            <BarChart3 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white/90 text-sm">
                Cotações em Tempo Real
              </p>
              <p className="text-xs text-white/50 mt-1">
                Preços atualizados de soja, milho, feijão, boi gordo e vaca
                gorda em mais de 50 cidades brasileiras.
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex gap-3">
            <Globe2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white/90 text-sm">
                Chicago Board of Trade
              </p>
              <p className="text-xs text-white/50 mt-1">
                Cotações internacionais da CBOT em tempo real via Socket.IO com
                gráficos de tendência.
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex gap-3">
            <Newspaper className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white/90 text-sm">
                Notícias do Agronegócio
              </p>
              <p className="text-xs text-white/50 mt-1">
                Notícias coletadas automaticamente com sistema de tags e
                categorias para fácil navegação.
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex gap-3">
            <BarChart3 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white/90 text-sm">
                Gráficos Históricos
              </p>
              <p className="text-xs text-white/50 mt-1">
                Evolução dos preços nos últimos 30 dias com gráficos interativos
                e comparação entre cidades.
              </p>
            </div>
          </div>

          <div className="bg-white/5 rounded-xl p-4 flex gap-3">
            <ShoppingCart className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white/90 text-sm">
                Classificados Agrícolas
              </p>
              <p className="text-xs text-white/50 mt-1">
                Compre e venda tratores, máquinas, implementos, gado e fazendas
                diretamente na plataforma.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold mb-4">Stack Tecnológico</h2>
        <div className="text-white/70 text-sm leading-relaxed space-y-2">
          <p>
            A AgroComm é construída com tecnologias modernas para garantir
            performance e confiabilidade:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-white/50">
            <li>Next.js 16 — framework React com server-side rendering</li>
            <li>
              Socket.IO — comunicação em tempo real para cotações internacionais
            </li>
            <li>SQLite + Drizzle ORM — banco de dados leve e eficiente</li>
            <li>Tailwind CSS — design responsivo e moderno</li>
            <li>Web scraping automatizado — coleta de dados 6x/dia</li>
          </ul>
        </div>
      </section>

      <nav className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/ajuda"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Central de Ajuda
        </Link>
        <Link
          href="/suporte"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <MessageSquare className="w-4 h-4" />
          Fale Conosco
        </Link>
      </nav>
    </main>
  );
}
