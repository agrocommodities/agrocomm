import type { Metadata } from "next";
import { Suspense } from "react";
import ChicagoClient from "./ChicagoClient";
import Breadcrumb from "@/components/Breadcrumb";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/actions/subscriptions";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bolsa de Chicago (CBOT) — Cotações em Tempo Real",
  description:
    "Acompanhe em tempo real as cotações das principais commodities agropecuárias na Bolsa de Chicago (CBOT/CME Group): soja, milho e boi gordo, com valores em dólar e real.",
  openGraph: {
    title: "Bolsa de Chicago (CBOT) — Cotações em Tempo Real",
    description:
      "Cotações em tempo real de commodities agropecuárias na CBOT: soja, milho e boi gordo.",
  },
  alternates: {
    canonical: "https://agrocomm.com.br/cotacoes/chicago",
  },
};

export default async function ChicagoPage() {
  const session = await getSession();

  let hasActivePlan = false;

  if (session) {
    const sub = await getUserSubscription();
    if (sub?.status === "active" && sub.priceHistory) {
      hasActivePlan = true;
    }
  }

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Breadcrumb items={[{ label: "Bolsa de Chicago" }]} />
        <h1 className="text-xl md:text-3xl font-bold">
          Bolsa de Chicago (CBOT)
        </h1>
        <div className="text-white/50 text-sm">
          Cotações em tempo real das principais commodities agropecuárias —
          Futuros CME Group / CBOT
        </div>
      </div>

      <Suspense>
        <ChicagoClient hasActivePlan={hasActivePlan} />
      </Suspense>
    </div>
  );
}
