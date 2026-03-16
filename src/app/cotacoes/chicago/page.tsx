import type { Metadata } from "next";
import Link from "next/link";
import ChicagoClient from "./ChicagoClient";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bolsa de Chicago (CBOT) — AgroComm",
  description:
    "Acompanhe em tempo real as cotações das principais commodities agropecuárias na Bolsa de Chicago (CBOT/CME Group), com valores em dólar e real.",
};

export default function ChicagoPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-sm text-white/40">
          <Link href="/" className="hover:underline">
            Início
          </Link>{" "}
          / Bolsa de Chicago
        </p>
        <h1 className="text-3xl font-bold">📊 Bolsa de Chicago (CBOT)</h1>
        <p className="text-white/50 mt-1 text-sm">
          Cotações em tempo real das principais commodities agropecuárias —
          Futuros CME Group / CBOT
        </p>
      </div>

      <ChicagoClient />
    </main>
  );
}
