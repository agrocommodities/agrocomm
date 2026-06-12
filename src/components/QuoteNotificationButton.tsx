"use client";

import { useState, useTransition } from "react";
import { Bell, BellRing } from "lucide-react";
import { toggleQuoteSubscription } from "@/actions/subscriptions";
import { useRouter } from "next/navigation";

interface Props {
  productId: number;
  cityId: number | null;
  isSubscribed: boolean;
  hasSession: boolean;
  hasActivePlan: boolean;
  className?: string;
  iconClassName?: string;
  onToggle?: (subscribed: boolean) => void;
}

export default function QuoteNotificationButton({
  productId,
  cityId,
  isSubscribed: initialSubscribed,
  hasSession,
  hasActivePlan,
  className,
  iconClassName,
  onToggle,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();

    if (!hasSession) {
      router.push("/login");
      return;
    }

    if (!hasActivePlan) {
      router.push("/planos");
      return;
    }

    startTransition(async () => {
      const result = await toggleQuoteSubscription(productId, cityId);
      if (result.error) {
        if (result.error.includes("plano")) {
          router.push("/planos");
        }
        return;
      }
      setSubscribed(result.subscribed);
      onToggle?.(result.subscribed);
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className={`rounded transition-colors cursor-pointer disabled:opacity-50 ${
        subscribed
          ? "text-green-400 hover:text-green-300"
          : "text-white/20 hover:text-white/50"
      } ${className ?? "p-1"}`}
      title={subscribed ? "Parar de acompanhar" : "Acompanhar cotação"}
    >
      {subscribed ? (
        <BellRing className={iconClassName ?? "w-3.5 h-3.5"} />
      ) : (
        <Bell className={iconClassName ?? "w-3.5 h-3.5"} />
      )}
    </button>
  );
}
