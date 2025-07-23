"use client";

import { useState } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCallback } from "react";
import Modal from "@/components/stripe/modal";


export default function PaymentButton() {
  const [isOpen, setIsOpen] = useState(false);

  const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  const fetchClientSecret = useCallback(async () => {
    return await fetch("/api/checkout", {
      method: "POST",
      // body: JSON.stringify({
      //   plan: "basic", // or any other plan you want to use
      // }),
    })
      .then((response) => response.json())
      .then((data) => data.client_secret)
  }, []);

  const options = { fetchClientSecret };

  return (
    <>
    <button onClick={() => setIsOpen(true)} className="rounded-md bg-gray-950/5 px-2.5 py-1.5 text-sm font-semibold text-gray-900 hover:bg-gray-950/10">Pagar já</button>
    <Modal title="Pagar Assinatura" setIsOpen={setIsOpen} open={isOpen}>
      <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </Modal>
    </>
  )
}

