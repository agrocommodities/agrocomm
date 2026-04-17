"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Calendar,
  Lock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import {
  getAvailableQuoteDates,
  getAvailableQuoteYears,
} from "@/actions/quotes";

interface HistoryDatePickerProps {
  hasActivePlan: boolean;
  historyDays: number;
  productSlug: string;
  onDateSelect: (date: string) => void;
}

const WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export default function HistoryDatePicker({
  hasActivePlan,
  historyDays,
  productSlug,
  onDateSelect,
}: HistoryDatePickerProps) {
  const [date, setDate] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const minDate = new Date();
  minDate.setDate(minDate.getDate() - historyDays);

  const fetchDates = useCallback(
    (year: number, month: number) => {
      startTransition(async () => {
        const dates = await getAvailableQuoteDates(
          productSlug,
          year,
          month + 1,
        );
        setAvailableDates(new Set(dates));
      });
    },
    [productSlug],
  );

  const fetchYears = useCallback(() => {
    startTransition(async () => {
      const years = await getAvailableQuoteYears(productSlug);
      setAvailableYears(years);
    });
  }, [productSlug]);

  useEffect(() => {
    if (hasActivePlan && calendarOpen) {
      fetchDates(viewYear, viewMonth);
    }
  }, [hasActivePlan, calendarOpen, viewYear, viewMonth, fetchDates]);

  useEffect(() => {
    if (hasActivePlan && calendarOpen && availableYears.length === 0) {
      fetchYears();
    }
  }, [hasActivePlan, calendarOpen, availableYears.length, fetchYears]);

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

  function handleDateInput(value: string) {
    setDate(value);
    setSelectedDate(value);
    if (value) {
      const [y, m] = value.split("-").map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      onDateSelect(value);
    }
  }

  function handleCalendarClick(day: number) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    setDate(dateStr);
    setSelectedDate(dateStr);
    onDateSelect(dateStr);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const startDay = firstDayOfMonth(viewYear, viewMonth);
  const todayStr = now.toISOString().slice(0, 10);
  const minDateStr = minDate.toISOString().slice(0, 10);

  const isInRange = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateStr >= minDateStr && dateStr <= todayStr;
  };

  const isAvailable = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return availableDates.has(dateStr);
  };

  const isSelected = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return selectedDate === dateStr;
  };

  const isToday = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return todayStr === dateStr;
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
      {/* Quick date input row */}
      <div className="flex items-center gap-3 flex-wrap">
        <Calendar className="w-5 h-5 text-green-400 shrink-0" />
        <label className="text-sm font-medium text-white/70 flex items-center gap-3 flex-wrap">
          Consultar cotação por data:
          <input
            type="date"
            value={date}
            onChange={(e) => handleDateInput(e.target.value)}
            min={minDateStr}
            max={todayStr}
            className="bg-[#2a3925] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white"
          />
        </label>
        <span className="text-xs text-white/30">
          (últimos {historyDays} dias)
        </span>
        <button
          type="button"
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="ml-auto text-xs text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <Calendar className="w-3.5 h-3.5" />
          {calendarOpen ? "Fechar calendário" : "Abrir calendário"}
        </button>
      </div>

      {/* Calendar grid */}
      {calendarOpen && (
        <div className="mt-4 bg-white/3 border border-white/10 rounded-xl p-4 max-w-sm mx-auto sm:mx-0">
          {/* Calendar header: month/year nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4 text-white/60" />
            </button>

            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">{MONTHS[viewMonth]}</span>

              {/* Year dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setYearDropdownOpen(!yearDropdownOpen)}
                  className="flex items-center gap-1 text-sm font-semibold text-green-400 hover:text-green-300 transition-colors cursor-pointer"
                >
                  {viewYear}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${yearDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {yearDropdownOpen && availableYears.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-1/2 -translate-x-1/2 bg-[#2a3525] border border-white/15 rounded-lg shadow-xl overflow-hidden max-h-40 overflow-y-auto min-w-[5rem]">
                    {availableYears.map((y) => (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          setViewYear(y);
                          setYearDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-1.5 text-sm text-center transition-colors cursor-pointer ${
                          y === viewYear
                            ? "bg-green-500/20 text-green-300"
                            : "hover:bg-white/10"
                        }`}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
              aria-label="Próximo mês"
            >
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          </div>

          {/* Loading indicator */}
          {isPending && (
            <div className="text-center text-xs text-white/30 mb-2">
              Carregando...
            </div>
          )}

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="text-center text-[10px] text-white/30 font-medium py-1"
              >
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: startDay }, (_, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: spacer cells have no stable id
              <div key={`empty-${i}`} />
            ))}

            {/* Day buttons */}
            {Array.from({ length: totalDays }, (_, i) => {
              const day = i + 1;
              const inRange = isInRange(day);
              const available = isAvailable(day);
              const selected = isSelected(day);
              const today = isToday(day);
              const clickable = inRange && available;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && handleCalendarClick(day)}
                  className={`relative w-full aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-all ${
                    selected
                      ? "bg-green-500 text-white ring-2 ring-green-400/50"
                      : clickable
                        ? "hover:bg-white/10 cursor-pointer text-white/80"
                        : "text-white/15 cursor-default"
                  } ${today && !selected ? "ring-1 ring-white/20" : ""}`}
                >
                  {day}
                  {available && !selected && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-green-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span className="text-[10px] text-white/30">Com cotações</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border border-white/20" />
              <span className="text-[10px] text-white/30">Hoje</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
