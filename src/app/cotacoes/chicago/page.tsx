import type { Metadata } from "next";
import ChicagoClient from "./ChicagoClient";
import Breadcrumb from "@/components/Breadcrumb";

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

export default function ChicagoPage() {
  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <Breadcrumb items={[{ label: "Bolsa de Chicago" }]} />
        <h1 className="text-xl md:text-3xl font-bold">
          📊 Bolsa de Chicago (CBOT)
        </h1>
        <div className="text-white/50 text-sm">
          Cotações em tempo real das principais commodities agropecuárias —
          Futuros CME Group / CBOT
        </div>
      </div>

      <ChicagoClient />
    </div>
  );
}
