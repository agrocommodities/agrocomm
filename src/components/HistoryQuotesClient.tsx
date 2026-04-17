"use client";

import { useState, useTransition } from "react";
import HistoryDatePicker from "./HistoryDatePicker";
import ProductQuotesTable from "./ProductQuotesTable";
import { getQuotesByDate } from "@/actions/quotes";
import type { QuoteRow } from "@/actions/quotes";

interface Props {
  productSlug: string;
  hasActivePlan: boolean;
  historyDays: number;
}

export default function HistoryQuotesClient({
  productSlug,
  hasActivePlan,
  historyDays,
}: Props) {
  const [historicalQuotes, setHistoricalQuotes] = useState<QuoteRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDateSelect(date: string) {
    setSelectedDate(date);
    startTransition(async () => {
      const data = await getQuotesByDate(productSlug, date);
      setHistoricalQuotes(data);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <HistoryDatePicker
        hasActivePlan={hasActivePlan}
        historyDays={historyDays}
        productSlug={productSlug}
        onDateSelect={handleDateSelect}
      />

      {selectedDate && hasActivePlan && (
        <div>
          <h3 className="text-sm font-medium text-white/50 mb-2">
            Cotações de{" "}
            {new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR")}
          </h3>
          {isPending ? (
            <div className="text-center py-6 text-white/30 text-sm">
              Carregando...
            </div>
          ) : historicalQuotes.length === 0 ? (
            <div className="text-center py-6 text-white/30 text-sm">
              Sem cotações nesta data.
            </div>
          ) : (
            <ProductQuotesTable
              rows={historicalQuotes}
              productSlug={productSlug}
            />
          )}
        </div>
      )}
    </div>
  );
}
