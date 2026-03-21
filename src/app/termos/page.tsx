import Link from "next/link";
import { FileText, Shield } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Termos de Uso — AgroComm",
  description:
    "Termos e condições de uso da plataforma AgroComm. Leia antes de utilizar nossos serviços.",
  alternates: {
    canonical: "https://agrocomm.com.br/termos",
  },
};

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <div>
        <Breadcrumb items={[{ label: "Termos de Uso" }]} />
        <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3 mt-1">
          <FileText className="w-8 h-8 text-green-400" />
          Termos de Uso
        </h1>
        <p className="text-white/50 mt-2 text-sm">
          Última atualização: 20 de março de 2026
        </p>
      </div>

      <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8 text-white/70 text-sm leading-relaxed space-y-6">
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            1. Aceitação dos Termos
          </h2>
          <p>
            Ao acessar e utilizar a plataforma AgroComm
            (&quot;agrocomm.com.br&quot;), você concorda com estes Termos de
            Uso. Caso não concorde com qualquer disposição, não utilize a
            plataforma.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            2. Descrição do Serviço
          </h2>
          <p>A AgroComm é uma plataforma digital que oferece:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Cotações de commodities agropecuárias do mercado físico brasileiro
              (soja, milho, feijão, boi gordo, vaca gorda)
            </li>
            <li>
              Cotações internacionais da Bolsa de Chicago (CBOT) em tempo real
            </li>
            <li>Notícias do agronegócio coletadas de fontes públicas</li>
            <li>
              Classificados agrícolas para compra e venda de máquinas,
              implementos, gado e propriedades
            </li>
            <li>Gráficos históricos e comparativos de preços</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            3. Cadastro e Conta
          </h2>
          <p>
            Algumas funcionalidades, como publicar classificados e receber
            notificações, exigem a criação de uma conta. Ao se cadastrar, você
            se compromete a:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Fornecer informações verdadeiras e atualizadas</li>
            <li>Manter a segurança da sua senha e credenciais de acesso</li>
            <li>Não compartilhar sua conta com terceiros</li>
            <li>
              Notificar a AgroComm imediatamente em caso de uso não autorizado
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            4. Classificados Agrícolas
          </h2>
          <p>Ao utilizar a seção de classificados, o usuário se obriga a:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Publicar apenas anúncios de produtos e serviços lícitos
              relacionados ao agronegócio
            </li>
            <li>
              Fornecer descrições precisas e fotos reais dos produtos anunciados
            </li>
            <li>
              Não utilizar a plataforma para fraudes, golpes ou atividades
              ilegais
            </li>
            <li>
              Respeitar as regras de moderação — anúncios podem ser removidos
              sem aviso prévio
            </li>
          </ul>
          <p>
            A AgroComm não intermedia transações comerciais entre usuários. Toda
            negociação, pagamento e entrega são de responsabilidade exclusiva
            das partes envolvidas.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            5. Propriedade Intelectual
          </h2>
          <p>
            Todo o conteúdo da plataforma — incluindo textos, layout, código,
            gráficos e logotipos — é de propriedade da AgroComm ou de seus
            licenciadores. A reprodução total ou parcial sem autorização prévia
            é proibida.
          </p>
          <p>
            As notícias exibidas na plataforma são coletadas de fontes públicas
            e sempre apresentam citação da fonte original com link para o
            conteúdo completo.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            6. Isenção de Responsabilidade
          </h2>
          <p>
            As cotações e informações apresentadas na AgroComm são de caráter
            informativo e não constituem recomendação de investimento, compra ou
            venda de commodities.
          </p>
          <p>
            Embora nos esforcemos para manter os dados atualizados e precisos, a
            AgroComm não garante a exatidão, integridade ou pontualidade das
            informações. O uso das informações é de responsabilidade exclusiva
            do usuário.
          </p>
          <p>A AgroComm não se responsabiliza por:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Decisões financeiras ou comerciais tomadas com base nas
              informações da plataforma
            </li>
            <li>
              Prejuízos decorrentes de indisponibilidade temporária do serviço
            </li>
            <li>
              Transações realizadas entre usuários na seção de classificados
            </li>
            <li>Conteúdo de sites externos linkados na plataforma</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            7. Conduta do Usuário
          </h2>
          <p>É proibido:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              Tentar acessar áreas restritas ou interferir no funcionamento da
              plataforma
            </li>
            <li>
              Utilizar bots, scrapers ou ferramentas automatizadas para coletar
              dados sem autorização
            </li>
            <li>
              Publicar conteúdo ofensivo, discriminatório ou que viole direitos
              de terceiros
            </li>
            <li>
              Criar múltiplas contas para contornar restrições ou banimentos
            </li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            8. Modificações nos Termos
          </h2>
          <p>
            A AgroComm reserva-se o direito de alterar estes Termos de Uso a
            qualquer momento. As alterações entram em vigor na data de sua
            publicação. O uso continuado da plataforma após as alterações
            implica na aceitação dos novos termos.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">
            9. Legislação Aplicável
          </h2>
          <p>
            Estes Termos de Uso são regidos pelas leis da República Federativa
            do Brasil. Qualquer disputa será resolvida no foro da comarca do
            domicílio do usuário, conforme o Código de Defesa do Consumidor.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white/90">10. Contato</h2>
          <p>
            Para dúvidas sobre estes Termos de Uso, entre em contato pela nossa
            página de{" "}
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
          href="/privacidade"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <Shield className="w-4 h-4" />
          Política de Privacidade
        </Link>
      </nav>
    </div>
  );
}
