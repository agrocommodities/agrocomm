"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Send,
  Plus,
  Trash2,
  Edit2,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  XCircle,
  Users,
  MessageSquare,
  AlertTriangle,
  Phone,
  X,
} from "lucide-react";
import {
  createSubscriber,
  updateSubscriber,
  deleteSubscriber,
  toggleSubscriber,
  sendDailyQuotes,
} from "@/actions/whatsapp";
import type { WhatsAppSubscriber, WhatsAppLogEntry } from "@/actions/whatsapp";

type Product = {
  id: number;
  name: string;
  slug: string;
  category: string;
  unit: string;
};

type Stats = {
  totalSubscribers: number;
  activeSubscribers: number;
  todaySent: number;
  todayErrors: number;
};

export default function WhatsAppManager({
  initialSubscribers,
  initialLogs,
  allProducts,
  stats,
}: {
  initialSubscribers: WhatsAppSubscriber[];
  initialLogs: WhatsAppLogEntry[];
  allProducts: Product[];
  stats: Stats;
}) {
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{
    total: number;
    success: number;
    errors: number;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formName, setFormName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formProducts, setFormProducts] = useState<number[]>([]);
  const [formError, setFormError] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Agrupa produtos por categoria
  const grouped = allProducts.reduce<Record<string, Product[]>>((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    graos: "Grãos",
    pecuaria: "Pecuária",
    cafe: "Café",
    acucar: "Açúcar",
    algodao: "Algodão",
  };

  function openNewForm() {
    setEditingId(null);
    setFormName("");
    setFormPhone("");
    setFormProducts([]);
    setFormError("");
    setShowForm(true);
  }

  function openEditForm(sub: WhatsAppSubscriber) {
    setEditingId(sub.id);
    setFormName(sub.name);
    setFormPhone(sub.phone);
    setFormProducts(sub.products.map((p) => p.id));
    setFormError("");
    setShowForm(true);
  }

  function toggleProduct(id: number) {
    setFormProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
    );
  }

  async function handleSubmit() {
    if (!formName.trim() || !formPhone.trim()) {
      setFormError("Nome e telefone são obrigatórios");
      return;
    }
    if (formProducts.length === 0) {
      setFormError("Selecione ao menos um produto");
      return;
    }

    startTransition(async () => {
      const result = editingId
        ? await updateSubscriber(
            editingId,
            formName.trim(),
            formPhone.trim(),
            formProducts,
          )
        : await createSubscriber(
            formName.trim(),
            formPhone.trim(),
            formProducts,
          );

      if ("error" in result && result.error) {
        setFormError(result.error);
      } else {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  async function handleSendAll() {
    setSending(true);
    setSendResult(null);
    try {
      const result = await sendDailyQuotes();
      setSendResult({
        total: result.total,
        success: result.success,
        errors: result.errors,
      });
      router.refresh();
    } catch {
      setSendResult({ total: 0, success: 0, errors: 1 });
    } finally {
      setSending(false);
    }
  }

  function handleDelete(id: number) {
    if (!confirm("Remover este assinante?")) return;
    startTransition(async () => {
      await deleteSubscriber(id);
      router.refresh();
    });
  }

  function handleToggle(id: number) {
    startTransition(async () => {
      await toggleSubscriber(id);
      router.refresh();
    });
  }

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Total Assinantes",
            value: stats.totalSubscribers,
            icon: Users,
          },
          { label: "Ativos", value: stats.activeSubscribers, icon: Phone },
          {
            label: "Enviados Hoje",
            value: stats.todaySent,
            icon: MessageSquare,
          },
          {
            label: "Erros Hoje",
            value: stats.todayErrors,
            icon: AlertTriangle,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3"
          >
            <Icon className="w-5 h-5 text-green-400 shrink-0" />
            <div>
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs text-white/50">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={handleSendAll}
          disabled={sending}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
        >
          <Send className={`w-4 h-4 ${sending ? "animate-pulse" : ""}`} />
          {sending ? "Enviando..." : "Enviar Cotações Agora"}
        </button>
        <button
          type="button"
          onClick={openNewForm}
          className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Assinante
        </button>
      </div>

      {/* Send result */}
      {sendResult && (
        <div
          className={`p-4 rounded-xl border ${
            sendResult.errors > 0
              ? "bg-red-500/10 border-red-500/20"
              : "bg-green-500/10 border-green-500/20"
          }`}
        >
          <p className="text-sm font-medium">
            Envio concluído: {sendResult.success}/{sendResult.total} enviados
            com sucesso
            {sendResult.errors > 0 && `, ${sendResult.errors} erro(s)`}
          </p>
        </div>
      )}

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-[#2a3425] border border-white/10 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {editingId ? "Editar Assinante" : "Novo Assinante"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="p-1 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
                {formError}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="wa-name"
                  className="block text-sm font-medium text-white/70 mb-1"
                >
                  Nome
                </label>
                <input
                  id="wa-name"
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <label
                  htmlFor="wa-phone"
                  className="block text-sm font-medium text-white/70 mb-1"
                >
                  Telefone (com código do país)
                </label>
                <input
                  id="wa-phone"
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="Ex: 5567998552020"
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              <div>
                <p className="block text-sm font-medium text-white/70 mb-2">
                  Cotações para receber
                </p>
                <div className="flex flex-col gap-3">
                  {Object.entries(grouped).map(([category, prods]) => (
                    <div key={category}>
                      <p className="text-xs font-semibold text-green-400 uppercase mb-1">
                        {categoryLabels[category] ?? category}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {prods.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleProduct(p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                              formProducts.includes(p.id)
                                ? "bg-green-600/30 border-green-500/50 text-green-300"
                                : "bg-white/5 border-white/10 text-white/60 hover:bg-white/10"
                            }`}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="mt-2 w-full py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-sm font-medium transition-colors"
              >
                {isPending
                  ? "Salvando..."
                  : editingId
                    ? "Salvar Alterações"
                    : "Cadastrar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscribers list */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Assinantes</h2>
        {initialSubscribers.length === 0 ? (
          <p className="text-sm text-white/40">Nenhum assinante cadastrado.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {initialSubscribers.map((sub) => (
              <div
                key={sub.id}
                className={`bg-white/5 border border-white/10 rounded-xl p-4 ${
                  sub.active === 0 ? "opacity-50" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{sub.name}</p>
                    <p className="text-sm text-white/50">{sub.phone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(sub.id)}
                      disabled={isPending}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title={sub.active === 1 ? "Pausar" : "Ativar"}
                    >
                      {sub.active === 1 ? (
                        <ToggleRight className="w-5 h-5 text-green-400" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-white/40" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditForm(sub)}
                      className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(sub.id)}
                      disabled={isPending}
                      className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {sub.products.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {sub.products.map((p) => (
                      <span
                        key={p.id}
                        className="px-2 py-0.5 bg-green-600/20 text-green-300 text-xs rounded-full"
                      >
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Logs */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Histórico de Envios</h2>
        {initialLogs.length === 0 ? (
          <p className="text-sm text-white/40">Nenhum envio registrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/40 border-b border-white/10">
                  <th className="pb-2 pr-4">Assinante</th>
                  <th className="pb-2 pr-4">Telefone</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2">Data/Hora</th>
                </tr>
              </thead>
              <tbody>
                {initialLogs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="py-2 pr-4">{log.subscriberName ?? "—"}</td>
                    <td className="py-2 pr-4 text-white/60">{log.phone}</td>
                    <td className="py-2 pr-4">
                      {log.status === "success" ? (
                        <span className="inline-flex items-center gap-1 text-green-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> OK
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center gap-1 text-red-400"
                          title={log.errorMessage ?? ""}
                        >
                          <XCircle className="w-3.5 h-3.5" /> Erro
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-white/50">
                      {new Date(log.sentAt).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
