"use client";

import { useState } from "react";
import { Calendar, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HistoryDatePickerProps {
  hasActivePlan: boolean;
  historyDays: number;
  onDateSelect: (date: string) => void;
}

export default function HistoryDatePicker({
  hasActivePlan,
  historyDays,
  onDateSelect,
}: HistoryDatePickerProps) {
  const [date, setDate] = useState("");

  if (!hasActivePlan) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-white/30" />
          <div>
            <p className="text-sm font-medium text-white/60">
              Histórico de preços
            </p>
            <p className="text-xs text-white/30">Disponível para assinantes</p>
          </div>
        </div>
        <Link
          href="/planos"
          className="text-sm font-medium text-green-400 hover:text-green-300 flex items-center gap-1"
        >
          Assinar
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - historyDays);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="w-5 h-5 text-green-400 shrink-0" />
        <label className="text-sm font-medium text-white/70 flex items-center gap-3 flex-wrap">
          Consultar cotação por data:
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              if (e.target.value) {
                onDateSelect(e.target.value);
              }
            }}
            min={minDate.toISOString().slice(0, 10)}
            max={new Date().toISOString().slice(0, 10)}
            className="bg-[#2a3925] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </label>
        <span className="text-xs text-white/30">
          (últimos {historyDays} dias)
        </span>
      </div>
    </div>
  );
}
