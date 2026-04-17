"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Trash2 } from "lucide-react";
import type { QuoteSubscriptionItem } from "@/actions/subscriptions";
import { removeQuoteSubscription } from "@/actions/subscriptions";

interface QuoteSubscriptionManagerProps {
  subscriptions: QuoteSubscriptionItem[];
  hasActivePlan: boolean;
}

export default function QuoteSubscriptionManager({
  subscriptions,
  hasActivePlan,
}: QuoteSubscriptionManagerProps) {
  const [items, setItems] = useState(subscriptions);
  const [isPending, startTransition] = useTransition();

  function handleRemove(id: number) {
    startTransition(async () => {
      const result = await removeQuoteSubscription(id);
      if (result.success) {
        setItems((prev) => prev.filter((s) => s.id !== id));
      }
    });
  }

  if (!hasActivePlan) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="text-center">
          <BellOff className="w-10 h-10 mx-auto text-white/20 mb-3" />
          <h3 className="font-semibold text-white/80 mb-1">
            Boletins indisponíveis
          </h3>
          <p className="text-sm text-white/40">
            Assine um plano para receber boletins de cotações por e-mail.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-5 h-5 text-green-400" />
        <h3 className="font-semibold">Cotações acompanhadas</h3>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-white/40">
          Nenhuma cotação sendo acompanhada. Vá até a página de{" "}
          <a
            href="/cotacoes/graos"
            className="text-green-400 hover:text-green-300"
          >
            cotações
          </a>{" "}
          e clique no ícone de notificação para acompanhar.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between bg-white/5 rounded-lg px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-medium">{item.productName}</span>
                {item.cityName && (
                  <span className="text-white/50">
                    {" "}
                    — {item.cityName}
                    {item.stateName ? `, ${item.stateName}` : ""}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                disabled={isPending}
                className="p-1.5 text-white/30 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-50"
                title="Remover"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
