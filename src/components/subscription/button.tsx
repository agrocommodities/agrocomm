"use client";

import { useState, useCallback } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";

export function PaymentButton({ priceId }: { priceId: string }) {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

  const fetchClientSecret = useCallback(async () => {
    return await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId }),
    })
      .then(res => res.json())
      .then(data => data.client_secret)
  }, [])

  const options = { fetchClientSecret };

  console.log("Options:", options);

  return (
    <>
      <button
        disabled={loading}
        onClick={() => setOpen(true)}
      >
        {/* {loading ? "Loading..." : "Subscribe"} */}
        {/* {priceId} */}
        Assinar
      </button>
      <div
        className={`fixed inset-0 z-50 grid place-content-center bg-black/50 p-4 ${open ? "grid" : "hidden"}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
          <div className="flex items-start justify-between">
            <h2 id="modalTitle" className="text-xl font-bold text-gray-900 sm:text-2xl dark:text-white">
              Assinar
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="-me-4 -mt-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-600 focus:outline-none dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="mt-4">
            <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        </div>
      </div>
    </>
  );
}