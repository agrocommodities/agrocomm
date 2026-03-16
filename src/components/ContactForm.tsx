"use client";

import { useState } from "react";
import { submitContactForm } from "@/actions/contact";
import { Send, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function ContactForm() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("loading");
    setErrorMsg("");

    const result = await submitContactForm(formData);

    if (result.error) {
      setStatus("error");
      setErrorMsg(result.error);
    } else {
      setStatus("success");
    }
  }

  if (status === "success") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400" />
        <div>
          <p className="font-bold text-lg">Mensagem enviada!</p>
          <p className="text-sm text-white/50 mt-1">
            Obrigado pelo contato. Responderemos o mais breve possível.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 transition-colors mt-2 cursor-pointer"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4">
      {status === "error" && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {errorMsg}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="name" className="text-xs font-medium text-white/50">
            Nome
          </label>
          <input
            type="text"
            id="name"
            name="name"
            required
            maxLength={100}
            placeholder="Seu nome completo"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-xs font-medium text-white/50">
            E-mail
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            maxLength={200}
            placeholder="seu@email.com"
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="subject" className="text-xs font-medium text-white/50">
          Assunto
        </label>
        <input
          type="text"
          id="subject"
          name="subject"
          required
          maxLength={200}
          placeholder="Ex: Dúvida sobre cotações"
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-medium text-white/50">
          Mensagem
        </label>
        <textarea
          id="message"
          name="message"
          required
          maxLength={5000}
          rows={5}
          placeholder="Descreva sua dúvida, sugestão ou problema..."
          className="bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm placeholder:text-white/20 focus:border-green-500/40 focus:outline-none transition-colors resize-y min-h-28"
        />
      </div>

      <button
        type="submit"
        disabled={status === "loading"}
        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-60 text-white font-semibold text-sm px-6 py-3 rounded-lg transition-colors cursor-pointer mt-2"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Send className="w-4 h-4" />
            Enviar Mensagem
          </>
        )}
      </button>
    </form>
  );
}
