import Modal from "@/components/Modal";
import {
  HelpCircle,
  TrendingUp,
  Globe2,
  BarChart3,
  Wallet,
  ShoppingCart,
} from "lucide-react";
export default function AjudaModal() {
  return (
    <Modal>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-green-400" />
            Central de Ajuda
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Entenda o mundo das commodities agropecuárias
          </p>
        </div>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Globe2 className="w-4 h-4 text-green-400" />O que é uma Commodity?
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Uma commodity é um produto básico produzido em larga escala e
            comercializado globalmente. No agronegócio brasileiro, as principais
            são: soja, milho, café, algodão, boi gordo e açúcar.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            De onde vem o preço?
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            O preço de referência é formado na Bolsa de Chicago (CBOT), que faz
            parte do CME Group. Para pecuária, a referência é a B3 e indicadores
            como o Cepea/Esalq.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            Precificação
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Soja e milho são cotados em centavos de dólar por bushel na CBOT e
            em R$/saca de 60 kg no Brasil. Boi gordo é cotado em R$/arroba (15
            kg).
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Wallet className="w-4 h-4 text-green-400" />
            Como investir?
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Contratos futuros na B3, ETFs (CORN11, SOJA11), ações do agro
            (SLCE3, JBSS3), FIAgros e CRAs são formas acessíveis de investir em
            commodities.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-green-400" />
            Classificados
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Compre e venda tratores, máquinas, implementos, gado e fazendas na
            nossa seção de classificados agrícolas.
          </p>
        </section>

        <a
          href="/ajuda"
          className="text-sm font-medium text-center text-green-400 hover:text-green-300 transition-colors"
        >
          Ver página completa →
        </a>
      </div>
    </Modal>
  );
}
