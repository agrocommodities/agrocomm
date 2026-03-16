import Modal from "@/components/Modal";
import { Info, BarChart3, Globe2, Newspaper } from "lucide-react";
export default function SobreModal() {
  return (
    <Modal>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <Info className="w-6 h-6 text-green-400" />
            Sobre a AgroComm
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Plataforma de cotações do agronegócio brasileiro
          </p>
        </div>

        <div className="text-sm text-white/70 space-y-3 leading-relaxed">
          <p>
            A <strong className="text-green-300">AgroComm</strong> é uma
            plataforma digital dedicada a reunir, organizar e apresentar
            cotações de commodities agropecuárias do mercado brasileiro.
          </p>
          <p>
            Nosso objetivo é democratizar o acesso à informação do agronegócio,
            permitindo que produtores, investidores e interessados acompanhem
            preços de soja, milho, feijão, boi gordo e vaca gorda em dezenas de
            cidades do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-lg p-3 flex gap-2">
            <BarChart3 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-white/90">Cotações</p>
              <p className="text-[11px] text-white/40">50+ cidades</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 flex gap-2">
            <Globe2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-white/90">CBOT</p>
              <p className="text-[11px] text-white/40">Tempo real</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 flex gap-2">
            <Newspaper className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-white/90">Notícias</p>
              <p className="text-[11px] text-white/40">Automático</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-lg p-3 flex gap-2">
            <BarChart3 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-xs text-white/90">Gráficos</p>
              <p className="text-[11px] text-white/40">30 dias</p>
            </div>
          </div>
        </div>

        <a
          href="/sobre"
          className="text-sm font-medium text-center text-green-400 hover:text-green-300 transition-colors"
        >
          Ver página completa →
        </a>
      </div>
    </Modal>
  );
}
