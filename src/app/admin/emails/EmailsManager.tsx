"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  XCircle,
  Send,
  Mail,
  FileText,
  Clock,
  Plus,
  Trash2,
  Save,
} from "lucide-react";
import {
  sendTestEmailAction,
  sendTemplateTestEmailAction,
  saveEmailTemplateConfigAction,
  deleteEmailTemplateConfigAction,
} from "@/actions/emails";
import type { EmailAlertLogRow } from "@/actions/emails";

interface EmailConfig {
  configured: boolean;
  from: string | null;
  user: string | null;
}

interface TemplateConfig {
  id: number;
  templateKey: string;
  subject: string | null;
  bodyMarkdown: string | null;
  updatedAt: string;
}

type Tab = "config" | "templates" | "logs";

const ALERT_TYPE_LABELS: Record<string, string> = {
  card_declined: "Cartão recusado",
  expiring: "Assinatura expirando",
  expired: "Assinatura expirada",
  pix_pending: "PIX pendente",
  boleto_pending: "Boleto pendente",
};

const TEMPLATE_KEY_LABELS: Record<string, string> = {
  "password-reset": "Redefinição de senha",
  "email-verification": "Verificação de e-mail",
  "subscription-welcome": "Boas-vindas (assinatura)",
  "payment-success": "Pagamento confirmado",
  "payment-failed": "Pagamento falhou",
  "subscription-expiring": "Assinatura expirando",
  "subscription-expired": "Assinatura expirada",
  "quote-bulletin": "Boletim de cotações",
  "news-bulletin": "Boletim de notícias",
  "pix-payment": "Pagamento via PIX",
  "boleto-payment": "Pagamento via Boleto",
};

export default function EmailsManager({
  config,
  initialTemplates,
  initialLogs,
}: {
  config: EmailConfig;
  initialTemplates: TemplateConfig[];
  initialLogs: EmailAlertLogRow[];
}) {
  const [tab, setTab] = useState<Tab>("config");
  const [templates, setTemplates] = useState(initialTemplates);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [templateTestResults, setTemplateTestResults] = useState<
    Record<string, { type: "success" | "error"; message: string }>
  >({});
  const [templateTestPending, setTemplateTestPending] = useState<Set<string>>(
    new Set(),
  );
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [newKey, setNewKey] = useState("");
  const [showNewForm, setShowNewForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleEdit(t: TemplateConfig) {
    setEditingKey(t.templateKey);
    setEditSubject(t.subject ?? "");
    setEditBody(t.bodyMarkdown ?? "");
  }

  function handleSaveTemplate(templateKey: string) {
    startTransition(async () => {
      const res = await saveEmailTemplateConfigAction(
        templateKey,
        editSubject,
        editBody,
      );
      if (res.error) return;
      setEditingKey(null);
      router.refresh();
    });
  }

  function handleDelete(id: number) {
    startTransition(async () => {
      await deleteEmailTemplateConfigAction(id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      router.refresh();
    });
  }

  function handleAddNew() {
    if (!newKey.trim()) return;
    startTransition(async () => {
      const res = await saveEmailTemplateConfigAction(
        newKey.trim(),
        editSubject,
        editBody,
      );
      if (res.error) return;
      setShowNewForm(false);
      setNewKey("");
      setEditSubject("");
      setEditBody("");
      router.refresh();
    });
  }

  async function handleSendTest() {
    setTestResult(null);
    const res = await sendTestEmailAction(testEmail);
    if (res.error) {
      setTestResult({ type: "error", message: res.error });
    } else {
      setTestResult({ type: "success", message: "E-mail de teste enviado!" });
    }
  }

  async function handleSendTemplateTest(templateKey: string) {
    setTemplateTestResults((prev) => {
      const next = { ...prev };
      delete next[templateKey];
      return next;
    });
    setTemplateTestPending((prev) => new Set(prev).add(templateKey));
    const res = await sendTemplateTestEmailAction(templateKey, testEmail);
    setTemplateTestPending((prev) => {
      const next = new Set(prev);
      next.delete(templateKey);
      return next;
    });
    if (res.error) {
      setTemplateTestResults((prev) => ({
        ...prev,
        [templateKey]: { type: "error", message: res.error as string },
      }));
    } else {
      setTemplateTestResults((prev) => ({
        ...prev,
        [templateKey]: { type: "success", message: "Enviado!" },
      }));
    }
  }

  const tabs: { key: Tab; label: string; icon: typeof Mail }[] = [
    { key: "config", label: "Configuração", icon: Mail },
    { key: "templates", label: "Templates", icon: FileText },
    { key: "logs", label: "Logs", icon: Clock },
  ];

  return (
    <>
      {/* Tabs */}
      <div className="flex gap-1 bg-white/5 border border-white/10 rounded-xl p-1 w-fit">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === key
                ? "bg-green-600/20 text-green-400"
                : "text-white/50 hover:text-white hover:bg-white/5"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Config tab */}
      {tab === "config" && (
        <div className="flex flex-col gap-4">
          {/* Status card */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-4">Status do SMTP</h2>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {config.configured ? (
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                <span className="text-sm">
                  {config.configured
                    ? "SMTP configurado"
                    : "SMTP não configurado"}
                </span>
              </div>
              {config.from && (
                <div className="text-sm text-white/50">
                  Remetente:{" "}
                  <span className="text-white/80 font-mono">{config.from}</span>
                </div>
              )}
              {config.user && (
                <div className="text-sm text-white/50">
                  Usuário:{" "}
                  <span className="text-white/80 font-mono">{config.user}</span>
                </div>
              )}
              {!config.configured && (
                <p className="text-xs text-white/40 mt-1">
                  Defina as variáveis{" "}
                  <code className="bg-white/10 px-1 rounded">MAIL_USER</code>,{" "}
                  <code className="bg-white/10 px-1 rounded">MAIL_PASS</code> e{" "}
                  <code className="bg-white/10 px-1 rounded">MAIL_ADDR</code> no{" "}
                  <code className="bg-white/10 px-1 rounded">.env</code>.
                </p>
              )}
            </div>
          </div>

          {/* Test email */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <h2 className="font-semibold mb-1">Enviar e-mail de teste</h2>
            <p className="text-xs text-white/40 mb-4">
              Informe o destinatário e envie um teste para cada tipo de e-mail.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="destinatario@exemplo.com"
                disabled={!config.configured}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 disabled:opacity-40"
              />
              <button
                type="button"
                disabled={!config.configured || !testEmail}
                onClick={handleSendTest}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/15 disabled:opacity-40 text-white/70 font-semibold text-sm px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
              >
                <Send className="w-4 h-4" />
                Genérico
              </button>
            </div>
            {testResult && (
              <div
                className={`mb-4 flex items-center gap-2 text-sm px-3 py-2 rounded-lg ${
                  testResult.type === "success"
                    ? "bg-green-500/10 text-green-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {testResult.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 shrink-0" />
                )}
                {testResult.message}
              </div>
            )}

            {/* Per-template test buttons */}
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <div className="px-4 py-2.5 bg-white/3 border-b border-white/10">
                <span className="text-xs font-medium text-white/40 uppercase tracking-wide">
                  Por template
                </span>
              </div>
              <div className="divide-y divide-white/5">
                {Object.entries(TEMPLATE_KEY_LABELS).map(([key, label]) => {
                  const result = templateTestResults[key];
                  const pending = templateTestPending.has(key);
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between px-4 py-2.5 gap-3"
                    >
                      <div className="min-w-0">
                        <span className="text-sm text-white/80">{label}</span>
                        <span className="ml-2 font-mono text-xs text-white/30">
                          {key}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {result && (
                          <span
                            className={`text-xs ${result.type === "success" ? "text-green-400" : "text-red-400"}`}
                          >
                            {result.message}
                          </span>
                        )}
                        <button
                          type="button"
                          disabled={!config.configured || !testEmail || pending}
                          onClick={() => handleSendTemplateTest(key)}
                          className="flex items-center gap-1.5 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-40 text-green-400 font-medium text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Send className="w-3 h-3" />
                          {pending ? "Enviando…" : "Enviar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates tab */}
      {tab === "templates" && (
        <div className="flex flex-col gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Templates de E-mail</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Sobreescritas de assunto e corpo para templates Pug
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowNewForm(true);
                  setNewKey("");
                  setEditSubject("");
                  setEditBody("");
                }}
                className="flex items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-400 font-medium text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>

            {/* New form */}
            {showNewForm && (
              <div className="px-5 py-4 border-b border-white/10 bg-white/3 flex flex-col gap-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/50">
                      Chave do template
                    </span>
                    <input
                      value={newKey}
                      onChange={(e) => setNewKey(e.target.value)}
                      placeholder="ex: password-reset"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 font-mono"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-xs text-white/50">
                      Assunto (opcional)
                    </span>
                    <input
                      value={editSubject}
                      onChange={(e) => setEditSubject(e.target.value)}
                      placeholder="Assunto do e-mail"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
                    />
                  </label>
                </div>
                <label className="flex flex-col gap-1">
                  <span className="text-xs text-white/50">
                    Corpo em Markdown (opcional)
                  </span>
                  <textarea
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                    rows={4}
                    placeholder="Conteúdo do e-mail em Markdown…"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 font-mono resize-y"
                  />
                </label>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNewForm(false)}
                    className="text-sm px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!newKey.trim() || isPending}
                    onClick={handleAddNew}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    Salvar
                  </button>
                </div>
              </div>
            )}

            {/* List */}
            {templates.length === 0 && !showNewForm ? (
              <div className="text-center py-10 text-white/30 text-sm">
                Nenhum template configurado
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {templates.map((t) => (
                  <div key={t.id} className="px-5 py-4">
                    {editingKey === t.templateKey ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm text-green-400">
                            {t.templateKey}
                          </span>
                          <span className="text-xs text-white/40">
                            {TEMPLATE_KEY_LABELS[t.templateKey] ?? ""}
                          </span>
                        </div>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-white/50">
                            Assunto (opcional)
                          </span>
                          <input
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            placeholder="Assunto do e-mail"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-xs text-white/50">
                            Corpo em Markdown (opcional)
                          </span>
                          <textarea
                            value={editBody}
                            onChange={(e) => setEditBody(e.target.value)}
                            rows={4}
                            placeholder="Conteúdo do e-mail em Markdown…"
                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-green-500/50 font-mono resize-y"
                          />
                        </label>
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => setEditingKey(null)}
                            className="text-sm px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleSaveTemplate(t.templateKey)}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white font-semibold text-sm px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                            Salvar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-sm text-green-400">
                              {t.templateKey}
                            </span>
                            {TEMPLATE_KEY_LABELS[t.templateKey] && (
                              <span className="text-xs text-white/40">
                                — {TEMPLATE_KEY_LABELS[t.templateKey]}
                              </span>
                            )}
                          </div>
                          {t.subject && (
                            <p className="text-sm text-white/60 truncate">
                              Assunto: {t.subject}
                            </p>
                          )}
                          {t.bodyMarkdown && (
                            <p className="text-xs text-white/30 truncate">
                              {t.bodyMarkdown.slice(0, 80)}…
                            </p>
                          )}
                          <p className="text-xs text-white/20 mt-1">
                            Atualizado em{" "}
                            {t.updatedAt.slice(0, 16).replace("T", " ")}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleEdit(t)}
                            className="text-xs px-3 py-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/5 transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleDelete(t.id)}
                            className="p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            aria-label="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Logs tab */}
      {tab === "logs" && (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/10">
            <h2 className="font-semibold">Histórico de Alertas</h2>
            <p className="text-xs text-white/40 mt-0.5">
              Últimos 100 alertas de assinatura enviados
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-3 font-medium">Usuário</th>
                  <th className="text-left px-5 py-3 font-medium hidden sm:table-cell">
                    E-mail
                  </th>
                  <th className="text-left px-5 py-3 font-medium">Tipo</th>
                  <th className="text-center px-5 py-3 font-medium">Status</th>
                  <th className="text-right px-5 py-3 font-medium">
                    Enviado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {initialLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-white/30">
                      Nenhum alerta registrado
                    </td>
                  </tr>
                ) : (
                  initialLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-t border-white/5 hover:bg-white/5"
                    >
                      <td className="px-5 py-3 font-medium">{log.userName}</td>
                      <td className="px-5 py-3 text-white/40 hidden sm:table-cell">
                        {log.userEmail}
                      </td>
                      <td className="px-5 py-3 text-white/60">
                        {ALERT_TYPE_LABELS[log.alertType] ?? log.alertType}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            log.status === "sent"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {log.status === "sent" ? "Enviado" : "Falhou"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right text-white/40 text-xs whitespace-nowrap">
                        {log.sentAt.slice(0, 16).replace("T", " ")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
