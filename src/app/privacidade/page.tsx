import Link from "next/link";
import { Shield, FileText } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — AgroComm",
  description:
    "Saiba como a AgroComm coleta, utiliza e protege seus dados pessoais.",
  alternates: {
    canonical: "https://agrocomm.com.br/privacidade",
  },
};

export default function PrivacidadePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-8">
      <div>
        <Breadcrumb items={[{ label: "Política de Privacidade" }]} />
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3 mt-1">
          <Shield className="w-8 h-8 text-green-400" />
          Política de Privacidade
        </h1>
        <p className="text-white/50 mt-2 text-sm">
          Última atualização: 20 de março de 2026
        </p>
      </div>

      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8 text-white/70 text-sm leading-relaxed space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">1. Introdução</h2>
          <p>
            A AgroComm (&quot;nós&quot;, &quot;nosso&quot;) respeita a sua
            privacidade e está comprometida com a proteção dos seus dados
            pessoais. Esta Política de Privacidade descreve como coletamos,
            utilizamos e protegemos suas informações, em conformidade com a Lei
            Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            2. Dados que Coletamos
          </h2>
          <p>Podemos coletar os seguintes tipos de dados:</p>

          <div className="bg-white/5 rounded-xl p-4 space-y-3">
            <div>
              <p className="font-semibold text-white/90 mb-1">
                Dados de cadastro
              </p>
              <p>
                Nome, e-mail e senha (armazenada com hash seguro) fornecidos ao
                criar uma conta.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90 mb-1">
                Dados de classificados
              </p>
              <p>
                Informações de contato (telefone, cidade, estado) e conteúdo dos
                anúncios publicados na seção de classificados.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90 mb-1">
                Dados de contato
              </p>
              <p>
                Nome, e-mail e mensagem enviados pelo formulário de suporte.
              </p>
            </div>
            <div>
              <p className="font-semibold text-white/90 mb-1">
                Dados de navegação
              </p>
              <p>
                Páginas visitadas, tempo de permanência e interações com a
                plataforma, coletados via Google Analytics para fins de melhoria
                do serviço.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            3. Finalidade do Tratamento
          </h2>
          <p>Utilizamos seus dados para:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Autenticar e gerenciar sua conta na plataforma</li>
            <li>
              Possibilitar a publicação e gerenciamento de classificados
              agrícolas
            </li>
            <li>Responder a mensagens enviadas pelo formulário de contato</li>
            <li>
              Enviar notificações sobre interações nos seus anúncios (se
              habilitado)
            </li>
            <li>
              Melhorar a experiência do usuário com base em dados de navegação
            </li>
            <li>Cumprir obrigações legais e regulatórias</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            4. Base Legal (LGPD)
          </h2>
          <p>
            O tratamento de dados pessoais pela AgroComm está fundamentado nas
            seguintes bases legais:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-white/90">Consentimento</strong> — ao
              criar uma conta e aceitar estes termos
            </li>
            <li>
              <strong className="text-white/90">Execução de contrato</strong> —
              para fornecer os serviços da plataforma
            </li>
            <li>
              <strong className="text-white/90">Interesse legítimo</strong> —
              para análise de uso e melhoria do serviço
            </li>
            <li>
              <strong className="text-white/90">Obrigação legal</strong> —
              quando exigido por legislação aplicável
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            5. Compartilhamento de Dados
          </h2>
          <p>
            A AgroComm <strong className="text-white/90">não vende</strong> seus
            dados pessoais. Podemos compartilhar informações apenas nos
            seguintes casos:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong className="text-white/90">Google Analytics</strong> —
              dados anonimizados de navegação para análise de uso
            </li>
            <li>
              <strong className="text-white/90">Obrigação legal</strong> —
              quando exigido por autoridade judicial ou administrativa
            </li>
            <li>
              <strong className="text-white/90">
                Informações públicas de classificados
              </strong>{" "}
              — dados do anúncio (título, descrição, fotos, cidade/estado) são
              visíveis publicamente na plataforma
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            6. Armazenamento e Segurança
          </h2>
          <p>Seus dados são protegidos por medidas técnicas que incluem:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Senhas armazenadas com hash bcrypt (nunca em texto puro)</li>
            <li>Autenticação via tokens JWT com prazo de expiração</li>
            <li>Acesso ao banco de dados restrito ao servidor da aplicação</li>
            <li>Comunicação criptografada via HTTPS</li>
          </ul>
          <p>
            Os dados são armazenados em servidor próprio e mantidos pelo tempo
            necessário para cumprir as finalidades descritas nesta política ou
            conforme exigido por lei.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            7. Seus Direitos (LGPD)
          </h2>
          <p>Conforme a LGPD, você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Confirmar a existência de tratamento dos seus dados</li>
            <li>Acessar seus dados pessoais</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>
              Solicitar a anonimização ou eliminação de dados desnecessários
            </li>
            <li>Revogar o consentimento a qualquer momento</li>
            <li>Solicitar a exclusão da sua conta e dados associados</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pela página de{" "}
            <Link
              href="/suporte"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              suporte
            </Link>
            .
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">8. Cookies</h2>
          <p>
            A AgroComm utiliza cookies essenciais para o funcionamento da
            plataforma (autenticação de sessão) e cookies de análise (Google
            Analytics). Você pode desabilitar cookies nas configurações do seu
            navegador, mas isso pode afetar funcionalidades da plataforma.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            9. Alterações nesta Política
          </h2>
          <p>
            Esta Política de Privacidade pode ser atualizada periodicamente. As
            alterações entram em vigor na data de publicação nesta página. O uso
            continuado da plataforma após as alterações implica na aceitação da
            nova política.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">10. Contato</h2>
          <p>
            Para dúvidas sobre esta Política de Privacidade ou sobre o
            tratamento dos seus dados, entre em contato pela nossa página de{" "}
            <Link
              href="/suporte"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              suporte
            </Link>
            .
          </p>
        </div>
      </section>

      <nav className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/termos"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Termos de Uso
        </Link>
      </nav>
    </main>
  );
}
