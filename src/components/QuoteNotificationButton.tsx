"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Bell, BellRing, Loader2 } from "lucide-react";
import { toggleQuoteSubscription } from "@/actions/subscriptions";
import { getQuoteSubscriptionStatus } from "@/actions/quote-subscription-status";
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

type Feedback = {
  message: string;
  type: "success" | "error";
};

export default function QuoteNotificationButton({
  productId,
  cityId,
  isSubscribed: initialSubscribed,
  hasSession: initialHasSession,
  hasActivePlan: initialHasActivePlan,
  className,
  iconClassName,
  onToggle,
}: Props) {
  const [subscribed, setSubscribed] = useState(initialSubscribed);
  const [hasSession, setHasSession] = useState(initialHasSession);
  const [canReceiveEmails, setCanReceiveEmails] =
    useState(initialHasActivePlan);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isPending, startTransition] = useTransition();
  const onToggleRef = useRef(onToggle);
  const router = useRouter();

  useEffect(() => {
    onToggleRef.current = onToggle;
  }, [onToggle]);

  useEffect(() => {
    let cancelled = false;

    startTransition(async () => {
      const status = await getQuoteSubscriptionStatus(productId, cityId);
      if (cancelled) return;

      setHasSession(status.hasSession);
      setCanReceiveEmails(status.canReceiveEmails);
      setSubscribed(status.subscribed);
      onToggleRef.current?.(status.subscribed);
    });

    return () => {
      cancelled = true;
    };
  }, [productId, cityId]);

  useEffect(() => {
    if (!feedback) return;
    const timeout = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timeout);
  }, [feedback]);

  function handleClick(event: React.MouseEvent) {
    event.stopPropagation();

    if (!hasSession) {
      router.push("/login");
      return;
    }

    if (!canReceiveEmails) {
      router.push("/planos");
      return;
    }

    startTransition(async () => {
      const result = await toggleQuoteSubscription(productId, cityId);

      if (result.error) {
        if (result.error.includes("Não autenticado")) {
          router.push("/login");
          return;
        }

        if (result.error.includes("plano")) {
          router.push("/planos");
          return;
        }

        setFeedback({
          message: "Não foi possível alterar o recebimento por e-mail.",
          type: "error",
        });
        return;
      }

      setSubscribed(result.subscribed);
      onToggleRef.current?.(result.subscribed);
      setFeedback({
        message: result.subscribed
          ? "Cotação adicionada aos boletins por e-mail."
          : "Cotação removida dos boletins por e-mail.",
        type: "success",
      });
    });
  }

  const title = subscribed
    ? "Parar de receber esta cotação por e-mail"
    : "Receber esta cotação por e-mail";

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={title}
        aria-pressed={subscribed}
        className={`rounded transition-colors cursor-pointer disabled:cursor-wait disabled:opacity-60 ${
          subscribed
            ? "text-green-400 hover:text-green-300"
            : "text-white/20 hover:text-white/60"
        } ${className ?? "p-1"}`}
        title={title}
      >
        {isPending ? (
          <Loader2
            className={`${iconClassName ?? "w-3.5 h-3.5"} animate-spin`}
          />
        ) : subscribed ? (
          <BellRing className={iconClassName ?? "w-3.5 h-3.5"} />
        ) : (
          <Bell className={iconClassName ?? "w-3.5 h-3.5"} />
        )}
      </button>

      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-4 left-1/2 z-100 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border px-4 py-3 text-center text-sm font-medium shadow-2xl backdrop-blur sm:bottom-6 ${
            feedback.type === "success"
              ? "border-green-500/30 bg-green-950/95 text-green-200"
              : "border-red-500/30 bg-red-950/95 text-red-200"
          }`}
        >
          {feedback.message}
        </div>
      )}
    </>
  );
}
