import Modal from "@/components/Modal";
import { FileText, Shield, Users, Scale, AlertTriangle } from "lucide-react";

export default function TermosModal() {
  return (
    <Modal>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <FileText className="w-6 h-6 text-green-400" />
            Termos de Uso
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Última atualização: 20 de março de 2026
          </p>
        </div>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Scale className="w-4 h-4 text-green-400" />
            Aceitação dos Termos
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Ao acessar e utilizar a plataforma AgroComm, você concorda com estes
            Termos de Uso. Caso não concorde com qualquer disposição, não
            utilize a plataforma.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-green-400" />
            Descrição do Serviço
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            A AgroComm oferece cotações de commodities agropecuárias do mercado
            físico brasileiro e internacional (CBOT), notícias do agronegócio,
            classificados agrícolas e gráficos históricos de preços.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-400" />
            Cadastro e Classificados
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Ao se cadastrar, você se compromete a fornecer informações
            verdadeiras e manter a segurança da sua conta. Nos classificados,
            publique apenas anúncios lícitos relacionados ao agronegócio. A
            AgroComm não intermedia transações entre usuários.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-green-400" />
            Isenção de Responsabilidade
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            As cotações e informações são de caráter informativo e não
            constituem recomendação de investimento. A AgroComm não garante a
            exatidão das informações e não se responsabiliza por decisões
            financeiras ou transações entre usuários.
          </p>
        </section>

        <a
          href="/termos"
          className="text-sm font-medium text-center text-green-400 hover:text-green-300 transition-colors"
        >
          Ver página completa →
        </a>
      </div>
    </Modal>
  );
}
