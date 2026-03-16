"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
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
  initialState?: string;
  initialCitySlug?: string;
}

const LS_STATE_KEY = "agrocomm_state";
const LS_CITY_KEY = "agrocomm_city";

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage unavailable
  }
}

function safeRemoveItem(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable
  }
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
  initialState,
  initialCitySlug,
}: Props) {
  const pathname = usePathname();

  function findCityIdBySlug(stateCode: string, slug: string): number {
    return (
      (citiesByState[stateCode] ?? []).find((c) => c.slug === slug)?.id ?? 0
    );
  }

  function findCitySlugById(stateCode: string, cityId: number): string {
    return (
      (citiesByState[stateCode] ?? []).find((c) => c.id === cityId)?.slug ?? ""
    );
  }

  const [selectedState, setSelectedState] = useState<string>(
    initialState ?? "",
  );
  const [selectedCityId, setSelectedCityId] = useState<number>(
    initialState && initialCitySlug
      ? findCityIdBySlug(initialState, initialCitySlug)
      : 0,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: restore from localStorage only on mount
  useEffect(() => {
    if (initialState) {
      safeSetItem(LS_STATE_KEY, initialState);
      if (initialCitySlug) safeSetItem(LS_CITY_KEY, initialCitySlug);
      return;
    }

    const savedState = safeGetItem(LS_STATE_KEY) ?? "";
    const savedCitySlug = safeGetItem(LS_CITY_KEY) ?? "";

    if (savedState && allStates.some((s) => s.code === savedState)) {
      setSelectedState(savedState);
      const cityId = savedCitySlug
        ? findCityIdBySlug(savedState, savedCitySlug)
        : 0;
      if (cityId) setSelectedCityId(cityId);

      const params = new URLSearchParams();
      params.set("estado", savedState);
      if (savedCitySlug) params.set("cidade", savedCitySlug);
      window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
    }
  }, []);

  function updateUrl(stateCode: string, citySlug: string) {
    const params = new URLSearchParams();
    if (stateCode) params.set("estado", stateCode);
    if (citySlug) params.set("cidade", citySlug);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `${pathname}?${query}` : pathname,
    );
  }

  function handleStateChange(code: string) {
    setSelectedState(code);
    setSelectedCityId(0);
    if (code) {
      safeSetItem(LS_STATE_KEY, code);
    } else {
      safeRemoveItem(LS_STATE_KEY);
    }
    safeRemoveItem(LS_CITY_KEY);
    updateUrl(code, "");
  }

  function handleCityChange(id: number) {
    setSelectedCityId(id);
    const slug = findCitySlugById(selectedState, id);
    if (slug) {
      safeSetItem(LS_CITY_KEY, slug);
    } else {
      safeRemoveItem(LS_CITY_KEY);
    }
    updateUrl(selectedState, slug);
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
    <>
      <section className="bg-linear-to-br from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-2xl p-5 flex flex-col gap-5">
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
          </div>
        )}
      </section>

      {/* Chart — single-city (by date) or multi-city */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <h2 className="font-semibold text-sm text-white/70 mb-4">
          {selectedCityId > 0 && cityHistory
            ? `Evolução — ${cityHistory.city}/${cityHistory.state} — últimos 30 dias`
            : selectedState
              ? `Evolução — ${selectedState} — últimos 30 dias`
              : "Evolução — últimos 30 dias por praça"}
        </h2>
        {selectedCityId > 0 && cityHistory && cityHistory.points.length > 0 ? (
          <QuoteChart data={cityHistory.points} unit={unit} color="#4ade80" />
        ) : (
          <QuoteChart
            lines={
              selectedState
                ? cityHistories.filter((l) => l.state === selectedState)
                : cityHistories
            }
            unit={unit}
          />
        )}
      </div>
    </>
  );
}
