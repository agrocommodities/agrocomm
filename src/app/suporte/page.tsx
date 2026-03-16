import Link from "next/link";
import { MessageSquare, HelpCircle, Info, Mail, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suporte — AgroComm",
  description: "Entre em contato com a equipe AgroComm.",
};

export default function SuportePage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-10 flex flex-col gap-10">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold flex items-center gap-3">
          <MessageSquare className="w-8 h-8 text-green-400" />
          Suporte
        </h1>
        <p className="text-white/50 mt-2 text-sm">
          Dúvidas, sugestões ou problemas? Fale conosco
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <section className="bg-white/3 border border-white/10 rounded-2xl p-6 sm:p-8">
            <h2 className="text-lg font-bold mb-5">Formulário de Contato</h2>
            <ContactForm />
          </section>
        </div>

        {/* Info sidebar */}
        <div className="flex flex-col gap-4">
          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-green-400" />
              E-mail
            </h3>
            <p className="text-sm text-white/50">contato@agrocomm.com.br</p>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-green-400" />
              Tempo de Resposta
            </h3>
            <p className="text-sm text-white/50">
              Geralmente respondemos em até 48 horas úteis.
            </p>
          </div>

          <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
            <h3 className="font-bold text-sm mb-2">Dúvidas frequentes?</h3>
            <p className="text-xs text-white/50 mb-3">
              Consulte nossa central de ajuda antes de enviar uma mensagem.
            </p>
            <Link
              href="/ajuda"
              className="text-xs font-medium text-green-400 hover:text-green-300 transition-colors flex items-center gap-1"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Acessar Central de Ajuda
            </Link>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/ajuda"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <HelpCircle className="w-4 h-4" />
          Central de Ajuda
        </Link>
        <Link
          href="/sobre"
          className="text-sm font-medium px-5 py-2.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-2"
        >
          <Info className="w-4 h-4" />
          Sobre a AgroComm
        </Link>
      </nav>
    </main>
  );
}
