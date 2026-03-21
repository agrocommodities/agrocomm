import Modal from "@/components/Modal";
import { Shield, Database, Lock, Eye, Cookie } from "lucide-react";

export default function PrivacidadeModal() {
  return (
    <Modal>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <Shield className="w-6 h-6 text-green-400" />
            Política de Privacidade
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Última atualização: 20 de março de 2026
          </p>
        </div>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-400" />
            Dados que Coletamos
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Coletamos dados de cadastro (nome, e-mail, senha com hash),
            informações de classificados (contato, cidade, estado), mensagens de
            suporte e dados de navegação via Google Analytics.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Eye className="w-4 h-4 text-green-400" />
            Finalidade e Base Legal
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Utilizamos seus dados para autenticação, gerenciamento de
            classificados, envio de notificações e melhoria da plataforma. O
            tratamento é fundamentado em consentimento, execução de contrato,
            interesse legítimo e obrigação legal, conforme a LGPD.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-green-400" />
            Segurança e Compartilhamento
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            A AgroComm não vende seus dados pessoais. Senhas são armazenadas com
            hash bcrypt, autenticação via JWT e comunicação criptografada via
            HTTPS. Dados podem ser compartilhados apenas com Google Analytics
            (anonimizados) ou por obrigação legal.
          </p>
        </section>

        <section className="bg-white/5 rounded-xl p-4">
          <h3 className="font-bold text-sm flex items-center gap-2 mb-2">
            <Cookie className="w-4 h-4 text-green-400" />
            Seus Direitos (LGPD)
          </h3>
          <p className="text-xs text-white/60 leading-relaxed">
            Você pode acessar, corrigir, anonimizar ou solicitar a exclusão dos
            seus dados pessoais a qualquer momento. Para exercer seus direitos,
            entre em contato pela página de suporte.
          </p>
        </section>

        <a
          href="/privacidade"
          className="text-sm font-medium text-center text-green-400 hover:text-green-300 transition-colors"
        >
          Ver página completa →
        </a>
      </div>
    </Modal>
  );
}
