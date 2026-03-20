"use client";

import { useState, useTransition } from "react";
import { updateModerationSetting } from "@/actions/adminClassifieds";
import { Phone, Mail, MapPin, Share2, Link2, Shield, Save } from "lucide-react";

interface Setting {
  id: number;
  key: string;
  enabled: number;
  action: string;
  censorText: string;
}

const LABELS: Record<
  string,
  { label: string; description: string; icon: typeof Phone }
> = {
  block_phones: {
    label: "Telefones",
    description: "Números de telefone, WhatsApp, celular",
    icon: Phone,
  },
  block_emails: {
    label: "E-mails",
    description: "Endereços de e-mail",
    icon: Mail,
  },
  block_addresses: {
    label: "Endereços",
    description: "CEP, ruas, rodovias, endereços",
    icon: MapPin,
  },
  block_social: {
    label: "Redes Sociais",
    description: "Instagram, Facebook, Twitter, @handles",
    icon: Share2,
  },
  block_links: {
    label: "Links",
    description: "URLs e links externos",
    icon: Link2,
  },
};

const ACTIONS = [
  { value: "censor", label: "Censurar" },
  { value: "censor_notify", label: "Censurar e notificar" },
  { value: "delete", label: "Somente apagar" },
  { value: "delete_notify", label: "Apagar + notificar" },
  { value: "none", label: "Não fazer nada" },
];

const inputClass =
  "bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400/50 transition w-full";

export default function ModerationManager({
  initialSettings,
}: {
  initialSettings: Setting[];
}) {
  const [settings, setSettings] = useState(initialSettings);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);

  function handleToggle(key: string, enabled: boolean) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, enabled: enabled ? 1 : 0 } : s)),
    );
    startTransition(async () => {
      await updateModerationSetting(key, { enabled: enabled ? 1 : 0 });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  function handleActionChange(key: string, action: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, action } : s)),
    );
    startTransition(async () => {
      await updateModerationSetting(key, { action });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  function handleCensorTextChange(key: string, censorText: string) {
    setSettings((prev) =>
      prev.map((s) => (s.key === key ? { ...s, censorText } : s)),
    );
  }

  function saveCensorText(key: string) {
    const setting = settings.find((s) => s.key === key);
    if (!setting) return;
    startTransition(async () => {
      await updateModerationSetting(key, { censorText: setting.censorText });
      setSaved(key);
      setTimeout(() => setSaved(null), 2000);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3 text-sm text-yellow-400 flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 mt-0.5" />
        <div>
          A moderação automática detecta e censura informações de contato em
          comentários dos classificados. Usuários que tentam driblar a censura
          (usando espaços, pontos, abreviações) também são detectados.
        </div>
      </div>

      {settings.map((setting) => {
        const meta = LABELS[setting.key];
        if (!meta) return null;
        const Icon = meta.icon;

        return (
          <div
            key={setting.key}
            className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-5"
          >
            {/* Header with toggle */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${setting.enabled ? "bg-green-500/10" : "bg-white/5"}`}
                >
                  <Icon
                    className={`w-5 h-5 ${setting.enabled ? "text-green-400" : "text-white/30"}`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{meta.label}</h3>
                  <p className="text-xs text-white/40">{meta.description}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(setting.key, !setting.enabled)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  setting.enabled ? "bg-green-600" : "bg-white/20"
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                    setting.enabled ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>

            {setting.enabled ? (
              <div className="flex flex-col gap-3 pl-0 sm:pl-12">
                {/* Action select */}
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor={`action-${setting.key}`}
                    className="text-xs text-white/50"
                  >
                    Ação quando detectado
                  </label>
                  <select
                    id={`action-${setting.key}`}
                    value={setting.action}
                    onChange={(e) =>
                      handleActionChange(setting.key, e.target.value)
                    }
                    className={inputClass}
                  >
                    {ACTIONS.map((a) => (
                      <option key={a.value} value={a.value}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Censor text (only for censor actions) */}
                {(setting.action === "censor" ||
                  setting.action === "censor_notify") && (
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor={`censor-${setting.key}`}
                      className="text-xs text-white/50"
                    >
                      Texto de substituição
                    </label>
                    <div className="flex gap-2">
                      <input
                        id={`censor-${setting.key}`}
                        type="text"
                        value={setting.censorText}
                        onChange={(e) =>
                          handleCensorTextChange(setting.key, e.target.value)
                        }
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={() => saveCensorText(setting.key)}
                        disabled={isPending}
                        className="shrink-0 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {saved === setting.key && (
                  <p className="text-xs text-green-400">Salvo!</p>
                )}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
