"use client";

import { useCallback, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: string;
  price_id: string;
}

interface PaymentModalProps {
  plan: Plan;
  isOpen: boolean;
  onClose: () => void;
}

export function PaymentModal({ plan, isOpen, onClose }: PaymentModalProps) {
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const fetchClientSecret = useCallback(async () => {
    console.log("Fetching client secret for plan:", plan.price_id);

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: plan.price_id }),
    });
    const data = await response.json();
    return data.client_secret;
  }, [plan.price_id]);

  // Fechar modal com ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90"
      aria-labelledby="modal-title" 
      role="dialog" 
      aria-modal="true"
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        {/* Modal panel */}
        <div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900" id="modal-title">
                Assinar {plan.name}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                onClick={onClose}
              >
                <span className="sr-only">Fechar</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mt-3">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {plan.description}
              </p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                R$ {(plan.price / 100).toFixed(2)} / {plan.interval === 'month' ? 'mês' : 'ano'}
              </p>
              
              <div className="stripe-checkout-container bg-white rounded-lg p-4 border border-gray-200">
                <EmbeddedCheckoutProvider 
                  stripe={stripePromise} 
                  options={{ fetchClientSecret }}
                >
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}