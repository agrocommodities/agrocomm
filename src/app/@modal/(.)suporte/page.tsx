import Modal from "@/components/Modal";
import { MessageSquare } from "lucide-react";
import ContactForm from "@/components/ContactForm";
export default function SuporteModal() {
  return (
    <Modal>
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-2xl font-extrabold flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-green-400" />
            Fale Conosco
          </h2>
          <p className="text-white/50 mt-1 text-sm">
            Dúvidas, sugestões ou problemas? Envie uma mensagem
          </p>
        </div>

        <ContactForm />

        <a
          href="/suporte"
          className="text-sm font-medium text-center text-green-400 hover:text-green-300 transition-colors"
        >
          Ver página completa →
        </a>
      </div>
    </Modal>
  );
}
