"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Bell,
  BellRing,
  Check,
  Loader2,
  Mail,
  MessageCircle,
} from "lucide-react";
import {
  toggleQuoteSubscription,
  unsubscribeQuote,
  type QuoteNotificationChannel,
} from "@/actions/subscriptions";
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
  const [notifyEmail, setNotifyEmail] = useState(false);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);
  const [hasSession, setHasSession] = useState(initialHasSession);
  const [canReceiveEmails, setCanReceiveEmails] =
    useState(initialHasActivePlan);
  const [hasVerifiedPhone, setHasVerifiedPhone] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const onToggleRef = useRef(onToggle);
  const menuRef = useRef<HTMLDivElement>(null);
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
      setHasVerifiedPhone(status.hasVerifiedPhone);
      setSubscribed(status.subscribed);
      setNotifyEmail(status.notifyEmail);
      setNotifyWhatsapp(status.notifyWhatsapp);
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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [menuOpen]);

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

    if (subscribed) {
      startTransition(async () => {
        const result = await unsubscribeQuote(productId, cityId);
        setSubscribed(result.subscribed);
        setNotifyEmail(false);
        setNotifyWhatsapp(false);
        onToggleRef.current?.(result.subscribed);
        setFeedback({
          message: "Notificações desativadas para esta cotação.",
          type: "success",
        });
      });
      return;
    }

    setMenuOpen((open) => !open);
  }

  function handleChannelClick(channel: QuoteNotificationChannel) {
    if (channel === "whatsapp" && !hasVerifiedPhone) {
      setMenuOpen(false);
      router.push("/ajustes");
      return;
    }

    startTransition(async () => {
      const result = await toggleQuoteSubscription(productId, cityId, channel);

      if (result.error) {
        if (result.error.includes("Não autenticado")) {
          router.push("/login");
          return;
        }

        if (result.error.includes("plano")) {
          router.push("/planos");
          return;
        }

        if (result.error.includes("Telefone")) {
          router.push("/ajustes");
          return;
        }

        setFeedback({
          message: "Não foi possível alterar as notificações.",
          type: "error",
        });
        return;
      }

      setSubscribed(result.subscribed);
      setNotifyEmail(result.notifyEmail);
      setNotifyWhatsapp(result.notifyWhatsapp);
      onToggleRef.current?.(result.subscribed);

      const channelLabel = channel === "email" ? "e-mail" : "WhatsApp";
      const enabled =
        channel === "email" ? result.notifyEmail : result.notifyWhatsapp;
      setFeedback({
        message: enabled
          ? `Você receberá notificações desta cotação por ${channelLabel}.`
          : `Notificações por ${channelLabel} desativadas para esta cotação.`,
        type: "success",
      });

      if (!result.subscribed) {
        setMenuOpen(false);
      }
    });
  }

  const title = subscribed
    ? "Parar de receber notificações desta cotação"
    : "Receber notificações desta cotação";

  return (
    <div ref={menuRef} className="relative inline-flex">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        aria-label={title}
        aria-pressed={subscribed}
        aria-expanded={menuOpen}
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

      <div
        className={`absolute right-0 top-full mt-2 w-52 z-50 bg-[#2d3a28] border border-white/10 rounded-xl shadow-2xl overflow-hidden
          transform transition-all duration-200 origin-top-right
          ${menuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"}`}
      >
        <div className="px-4 py-2.5 border-b border-white/10">
          <p className="text-xs font-semibold text-white/70">
            Receber notificações por:
          </p>
        </div>
        <div className="py-1.5">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleChannelClick("email");
            }}
            disabled={isPending}
            className="flex items-center justify-between gap-3 w-full px-4 py-2.5 text-sm hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <Mail className="w-4 h-4" />
              E-mail
            </span>
            {notifyEmail && <Check className="w-4 h-4 text-green-400" />}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              handleChannelClick("whatsapp");
            }}
            disabled={isPending}
            className="flex items-center justify-between gap-3 w-full px-4 py-2.5 text-sm hover:bg-white/10 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <span className="flex items-center gap-3">
              <MessageCircle className="w-4 h-4" />
              <span className="flex flex-col items-start">
                WhatsApp
                {!hasVerifiedPhone && (
                  <span className="text-xs text-white/40">
                    Verifique seu telefone em Ajustes
                  </span>
                )}
              </span>
            </span>
            {notifyWhatsapp && <Check className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </div>

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
    </div>
  );
}
