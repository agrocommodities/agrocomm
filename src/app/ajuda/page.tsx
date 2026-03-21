import Link from "next/link";
import {
  HelpCircle,
  Info,
  MessageSquare,
  TrendingUp,
  Globe2,
  BarChart3,
  Wallet,
  Lightbulb,
  ShoppingCart,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ajuda — AgroComm",
  description:
    "Entenda o que são commodities, como funciona a precificação e como investir no agronegócio.",
};

export default function AjudaPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <div>
        <Breadcrumb items={[{ label: "Ajuda" }]} />
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 mt-1">
          <HelpCircle className="w-8 h-8 text-green-400" />
          Central de Ajuda
        </h1>
        <p className="text-white/50 mt-2 text-sm">
          Tudo que você precisa saber sobre commodities agropecuárias
        </p>
      </div>

      {/* O que é uma commodity */}
      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Globe2 className="w-5 h-5 text-green-400" />O que é uma Commodity?
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            Uma <strong className="text-white/90">commodity</strong> é um
            produto básico de origem agropecuária, mineral ou energética que é
            produzido em larga escala e comercializado globalmente. A palavra
            vem do inglês e significa &quot;mercadoria&quot;.
          </p>
          <p>
            No agronegócio brasileiro, as principais commodities são:{" "}
            <strong className="text-white/90">soja</strong>,{" "}
            <strong className="text-white/90">milho</strong>,{" "}
            <strong className="text-white/90">café</strong>,{" "}
            <strong className="text-white/90">algodão</strong>,{" "}
            <strong className="text-white/90">boi gordo</strong> e{" "}
            <strong className="text-white/90">açúcar</strong>.
          </p>
          <p>
            O que diferencia uma commodity de outros produtos é que ela é{" "}
            <strong className="text-white/90">padronizada e fungível</strong> —
            ou seja, uma saca de soja produzida no Mato Grosso tem a mesma
            qualidade e especificações de uma produzida no Paraná. Isso permite
            que esses produtos sejam negociados em bolsas de valores ao redor do
            mundo.
          </p>
        </div>
      </section>

      {/* De onde vem o preço */}
      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-green-400" />
          De onde vem o preço?
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            O preço de referência internacional das commodities agrícolas é
            formado na{" "}
            <strong className="text-green-300">
              Bolsa de Chicago (CBOT — Chicago Board of Trade)
            </strong>
            , que faz parte do{" "}
            <strong className="text-white/90">CME Group</strong>, o maior
            mercado de derivativos do mundo.
          </p>
          <p>
            Na CBOT, produtores, traders, fundos de investimento e especuladores
            negociam contratos futuros e opções de commodities como soja, milho,
            trigo e aveia. Esses contratos estabelecem o preço pelo qual uma
            quantidade de produto será comprada ou vendida em uma data futura.
          </p>
          <p>
            Para pecuária (boi gordo e vaca gorda), a referência é a{" "}
            <strong className="text-white/90">
              B3 (Brasil, Bolsa, Balcão)
            </strong>{" "}
            aqui no Brasil, além de indicadores como o{" "}
            <strong className="text-white/90">Cepea/Esalq</strong>.
          </p>
          <p>
            O preço que você vê aqui no AgroComm reflete o{" "}
            <strong className="text-white/90">mercado físico brasileiro</strong>{" "}
            — ou seja, o preço real pelo qual as commodities estão sendo
            negociadas nas diferentes regiões do país. Esses valores são
            influenciados pela cotação de Chicago, pelo câmbio (dólar/real) e
            pela oferta e demanda local.
          </p>
        </div>
      </section>

      {/* Como funciona a precificação */}
      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-green-400" />
          Como é feita a precificação?
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            Cada commodity tem sua unidade de medida e forma de precificação:
          </p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-lg">🌱</span>
              <div>
                <p className="font-semibold text-white/90">Soja e Milho</p>
                <p>
                  Na Bolsa de Chicago, são cotados em{" "}
                  <strong className="text-green-300">
                    centavos de dólar por bushel
                  </strong>
                  . Um bushel de soja equivale a aproximadamente 27,2 kg (ou
                  ~2,2 sacas de 60 kg). No Brasil, são negociados em{" "}
                  <strong className="text-white/90">
                    R$ por saca de 60 kg
                  </strong>
                  .
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-lg">🐄</span>
              <div>
                <p className="font-semibold text-white/90">Boi Gordo</p>
                <p>
                  No Brasil, é cotado em{" "}
                  <strong className="text-white/90">R$ por arroba (@)</strong>.
                  Uma arroba equivale a 15 kg de carne. Na CBOT/CME, o Live
                  Cattle é cotado em{" "}
                  <strong className="text-green-300">
                    centavos de dólar por libra (lb)
                  </strong>
                  .
                </p>
              </div>
            </div>
          </div>

          <p>
            O preço final que o produtor brasileiro recebe depende de vários
            fatores: a cotação internacional, o câmbio, custos de frete,
            impostos e o chamado{" "}
            <strong className="text-white/90">prêmio</strong> (diferença entre o
            preço local e o de Chicago).
          </p>
        </div>
      </section>

      {/* Como investir */}
      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-green-400" />
          Como investir em commodities agropecuárias?
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            Mesmo que você não seja produtor rural ou ligado ao campo, existem
            diversas formas de investir em commodities:
          </p>

          <div className="grid gap-3">
            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold text-white/90 mb-1">
                📊 Contratos Futuros (B3)
              </p>
              <p>
                Através da B3, você pode negociar contratos futuros de boi
                gordo, milho, soja, café e outros. É necessário ter conta em uma
                corretora e margem de garantia. Requer mais conhecimento
                técnico.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold text-white/90 mb-1">
                🏦 ETFs de Commodities
              </p>
              <p>
                Fundos negociados em bolsa que replicam o desempenho de
                commodities. É a forma mais simples: você compra cotas como se
                fosse uma ação. Exemplo: CORN11 (milho), SOJA11.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold text-white/90 mb-1">
                📈 Ações de empresas do agro
              </p>
              <p>
                Investir em empresas listadas na bolsa que operam no
                agronegócio, como SLC Agrícola (SLCE3), BRF (BRFS3), JBS (JBSS3)
                e Cosan (CSAN3).
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold text-white/90 mb-1">
                💰 Fundos de Investimento Agro
              </p>
              <p>
                FIAgros — fundos de investimento nas cadeias produtivas
                agroindustriais, similares aos fundos imobiliários. Distribuem
                rendimentos mensais e são negociados na B3.
              </p>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <p className="font-semibold text-white/90 mb-1">
                📋 CRAs (Certificados de Recebíveis do Agronegócio)
              </p>
              <p>
                Títulos de renda fixa vinculados ao agronegócio. Geralmente
                isentos de Imposto de Renda para pessoa física e oferecem
                rentabilidade acima do CDI.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Como a AgroComm pode ajudar */}
      <section className="bg-green-500/5 border border-green-500/20 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-green-400" />
          Como a AgroComm pode te ajudar?
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            A AgroComm reúne em um só lugar as informações mais importantes do
            mercado agropecuário brasileiro:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong className="text-white/90">Cotações atualizadas</strong> de
              soja, milho, feijão, boi gordo e vaca gorda em dezenas de cidades
              do Brasil
            </li>
            <li>
              <strong className="text-white/90">
                Acompanhamento de Chicago
              </strong>{" "}
              — cotações em tempo real da Bolsa de Chicago (CBOT) para você
              entender como os preços internacionais afetam o mercado interno
            </li>
            <li>
              <strong className="text-white/90">Gráficos de tendência</strong>{" "}
              para analisar a evolução dos preços ao longo do tempo
            </li>
            <li>
              <strong className="text-white/90">Notícias do agronegócio</strong>{" "}
              com tags e categorias para você filtrar o que é relevante para a
              sua estratégia
            </li>
          </ul>
          <p>
            Seja você um produtor, investidor ou apenas alguém curioso sobre o
            mercado de commodities, a AgroComm oferece as ferramentas para tomar
            decisões mais informadas.
          </p>
        </div>
      </section>

      {/* Classificados */}
      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
          <ShoppingCart className="w-5 h-5 text-green-400" />
          Classificados Agrícolas
        </h2>
        <div className="text-white/70 space-y-3 text-sm leading-relaxed">
          <p>
            A AgroComm conta com uma seção de{" "}
            <strong className="text-white/90">classificados agrícolas</strong>,
            onde você pode comprar e vender tratores, máquinas, implementos,
            gado, fazendas e outros produtos do agronegócio.
          </p>
          <p>
            Para publicar um anúncio, basta criar uma conta gratuita e preencher
            o formulário com as informações do produto, fotos e preço. Os
            anúncios passam por moderação antes de serem publicados.
          </p>
          <p>
            Navegue pelos classificados por categoria, estado ou utilize a busca
            para encontrar exatamente o que precisa.
          </p>
          <Link
            href="/classificados"
            className="inline-flex items-center gap-2 text-green-400 hover:text-green-300 font-medium transition-colors"
          >
            Acessar classificados →
          </Link>
        </div>
      </section>

      {/* Links */}
      <nav className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/sobre"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          Sobre a AgroComm
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
