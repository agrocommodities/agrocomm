"use client";

import { useState, useEffect } from "react";
import { MapPin, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import QuoteChart from "@/components/QuoteChart";
import type {
  QuoteRow,
  CityLine,
  StateOption,
  CityOption,
} from "@/actions/quotes";

interface Props {
  todayQuotes: QuoteRow[];
  cityHistories: CityLine[];
  allStates: StateOption[];
  citiesByState: Record<string, CityOption[]>;
  unit: string;
}

const selectClass =
  "w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-green-400/50 transition appearance-none " +
  "text-white placeholder-white/40 cursor-pointer";

export default function LocationPriceSelector({
  todayQuotes,
  cityHistories,
  allStates,
  citiesByState,
  unit,
}: Props) {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedCityId, setSelectedCityId] = useState<number>(0);

  // Restore preference from localStorage
  useEffect(() => {
    const savedState = localStorage.getItem("agrocomm_state") ?? "";
    const savedCity = Number(localStorage.getItem("agrocomm_city") ?? 0);
    setSelectedState(savedState);
    setSelectedCityId(savedCity);
  }, []);

  function handleStateChange(code: string) {
    setSelectedState(code);
    setSelectedCityId(0);
    localStorage.setItem("agrocomm_state", code);
    localStorage.removeItem("agrocomm_city");
  }

  function handleCityChange(id: number) {
    setSelectedCityId(id);
    localStorage.setItem("agrocomm_city", String(id));
  }

  const availableCities = selectedState
    ? (citiesByState[selectedState] ?? [])
    : [];

  const todayRow = selectedCityId
    ? todayQuotes.find((q) => q.cityId === selectedCityId)
    : null;

  const cityHistory = selectedCityId
    ? cityHistories.find((l) => l.cityId === selectedCityId)
    : null;

  const hasTodayPrice = todayRow !== null && todayRow !== undefined;

  return (
    <section className="bg-gradient-to-br from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-2xl p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-green-400 shrink-0" />
        <div>
          <h2 className="font-semibold text-base">Minha Região</h2>
          <p className="text-xs text-white/50">
            Selecione seu estado e cidade para ver o preço do dia
          </p>
        </div>
      </div>

      {/* Dropdowns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className={selectClass}
            aria-label="Selecionar estado"
          >
            <option value="">Estado</option>
            {allStates.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code} — {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>

        <div className="relative">
          <select
            value={selectedCityId || ""}
            onChange={(e) => handleCityChange(Number(e.target.value))}
            disabled={!selectedState || availableCities.length === 0}
            className={`${selectClass} disabled:opacity-40`}
            aria-label="Selecionar cidade"
          >
            <option value="">Cidade</option>
            {availableCities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
        </div>
      </div>

      {/* Price card */}
      {selectedCityId > 0 && (
        <div className="flex flex-col gap-4">
          {hasTodayPrice ? (
            <div className="bg-white/5 border border-white/10 rounded-xl p-5">
              <p className="text-xs text-white/40 mb-1">
                Preço de hoje em{" "}
                <span className="text-green-400 font-medium">
                  {todayRow.city} — {todayRow.state}
                </span>
              </p>
              <div className="flex items-end gap-3 flex-wrap">
                <p className="text-4xl font-extrabold tracking-tight">
                  R${" "}
                  <span className="tabular-nums">
                    {todayRow.price.toFixed(2)}
                  </span>
                </p>
                {todayRow.variation !== null && (
                  <span
                    className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1 rounded-full mb-1 ${
                      todayRow.variation >= 0
                        ? "bg-green-500/20 text-green-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {todayRow.variation >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {todayRow.variation >= 0 ? "+" : ""}
                    {todayRow.variation.toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-xs text-white/30 mt-2">{unit}</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-sm text-white/40">
              Sem cotação hoje para esta cidade.
            </div>
          )}

          {/* 30-day chart for this city */}
          {cityHistory && cityHistory.points.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-white/40 mb-3">
                Evolução — últimos 30 dias
              </p>
              <QuoteChart
                data={cityHistory.points}
                unit={unit}
                color="#4ade80"
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
