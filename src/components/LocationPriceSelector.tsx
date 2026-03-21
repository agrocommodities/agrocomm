"use client";

import { useState, useEffect, useTransition } from "react";
import { MapPin, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import QuoteChart from "@/components/QuoteChart";
import { getCityHistoryByRange } from "@/actions/quotes";
import type {
  QuoteRow,
  HistoryPoint,
  StateOption,
  CityOption,
} from "@/actions/quotes";

interface Props {
  todayQuotes: QuoteRow[];
  allStates: StateOption[];
  citiesByState: Record<string, CityOption[]>;
  unit: string;
  productSlug: string;
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
  "w-full bg-[#2a3925] border border-white/20 rounded-xl px-4 py-3 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-green-400/50 transition appearance-none " +
  "text-white placeholder-white/40 cursor-pointer";

const optionClass = "";

export default function LocationPriceSelector({
  todayQuotes,
  allStates,
  citiesByState,
  unit,
  productSlug,
  initialState,
  initialCitySlug,
}: Props) {
  const [isPending, startTransition] = useTransition();

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
  const [cityHistory, setCityHistory] = useState<HistoryPoint[]>([]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: restore from localStorage only on mount
  useEffect(() => {
    if (initialState) {
      safeSetItem(LS_STATE_KEY, initialState);
      if (initialCitySlug) {
        safeSetItem(LS_CITY_KEY, initialCitySlug);
        const cityId = findCityIdBySlug(initialState, initialCitySlug);
        if (cityId) {
          startTransition(async () => {
            const h = await getCityHistoryByRange(productSlug, cityId, 30);
            setCityHistory(h);
          });
        }
      }
      return;
    }

    const savedState = safeGetItem(LS_STATE_KEY) ?? "";
    const savedCitySlug = safeGetItem(LS_CITY_KEY) ?? "";

    if (savedState && allStates.some((s) => s.code === savedState)) {
      setSelectedState(savedState);
      const cityId = savedCitySlug
        ? findCityIdBySlug(savedState, savedCitySlug)
        : 0;
      if (cityId) {
        setSelectedCityId(cityId);
        startTransition(async () => {
          const h = await getCityHistoryByRange(productSlug, cityId, 30);
          setCityHistory(h);
        });
      }

      if (savedCitySlug) {
        window.history.replaceState(
          null,
          "",
          `/cotacoes/${savedState.toLowerCase()}/${savedCitySlug}/${productSlug}`,
        );
      }
    }
  }, []);

  function updateUrl(stateCode: string, citySlug: string) {
    if (stateCode && citySlug) {
      window.history.replaceState(
        null,
        "",
        `/cotacoes/${stateCode.toLowerCase()}/${citySlug}/${productSlug}`,
      );
    } else {
      window.history.replaceState(null, "", `/cotacoes/${productSlug}`);
    }
  }

  function handleStateChange(code: string) {
    setSelectedState(code);
    setSelectedCityId(0);
    setCityHistory([]);
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

    if (id > 0) {
      startTransition(async () => {
        const h = await getCityHistoryByRange(productSlug, id, 30);
        setCityHistory(h);
      });
    } else {
      setCityHistory([]);
    }
  }

  const availableCities = selectedState
    ? (citiesByState[selectedState] ?? [])
    : [];

  const todayRow = selectedCityId
    ? todayQuotes.find((q) => q.cityId === selectedCityId)
    : null;

  const hasTodayPrice = todayRow !== null && todayRow !== undefined;

  return (
    <div className="flex flex-col gap-5">
      {/* Location selector bar */}
      <section className="bg-linear-to-br from-green-900/30 to-emerald-900/20 border border-green-500/20 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-green-400 shrink-0" />
          <div>
            <h2 className="font-semibold text-base">Selecione sua região</h2>
            <p className="text-xs text-white/50">
              Escolha estado e cidade para ver preços detalhados
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="relative">
            <select
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className={selectClass}
              aria-label="Selecionar estado"
            >
              <option value="" className={optionClass}>
                Estado
              </option>
              {allStates.map((s) => (
                <option key={s.code} value={s.code} className={optionClass}>
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
              <option value="" className={optionClass}>
                Cidade
              </option>
              {availableCities.map((c) => (
                <option key={c.id} value={c.id} className={optionClass}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          </div>
        </div>
      </section>

      {/* Price hero & chart */}
      {selectedCityId > 0 && (
        <>
          {/* Hero price card */}
          {hasTodayPrice ? (
            <section className="bg-linear-to-br from-[#1a2a16] to-[#162012] border border-green-500/15 rounded-2xl p-5 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-white/40 mb-1.5">
                    Preço atual em{" "}
                    <span className="text-green-400 font-medium">
                      {todayRow.city}, {todayRow.state}
                    </span>
                  </p>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-xs text-white/30">R$</span>
                    <span className="text-5xl sm:text-6xl font-extrabold tracking-tight tabular-nums leading-none">
                      {todayRow.price.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-white/30 mt-2">{unit}</p>
                </div>

                {todayRow.variation !== null && (
                  <div
                    className={`inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl self-start sm:self-auto ${
                      todayRow.variation >= 0
                        ? "bg-green-500/15 text-green-400 border border-green-500/20"
                        : "bg-red-500/15 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {todayRow.variation >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {todayRow.variation >= 0 ? "+" : ""}
                    {todayRow.variation.toFixed(2)}%
                    <span className="text-[10px] opacity-60 ml-1">hoje</span>
                  </div>
                )}
              </div>
            </section>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-6 text-center text-sm text-white/40">
              Sem cotação disponível hoje para esta cidade.
            </div>
          )}

          {/* Chart with range selector + stats */}
          <section className="bg-white/3 border border-white/10 rounded-2xl p-4 sm:p-5">
            <h2 className="font-semibold text-sm text-white/60 mb-4">
              Histórico de preços — {todayRow?.city ?? ""}/
              {todayRow?.state ?? selectedState}
            </h2>
            {isPending && cityHistory.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-white/30 text-sm">
                Carregando...
              </div>
            ) : (
              <QuoteChart
                data={cityHistory}
                unit={unit}
                color="#4ade80"
                productSlug={productSlug}
                cityId={selectedCityId}
                showRangeSelector
                initialRange={30}
              />
            )}
          </section>
        </>
      )}

      {/* Empty state when no city selected */}
      {!selectedCityId && selectedState && (
        <div className="bg-white/3 border border-white/10 border-dashed rounded-2xl px-5 py-10 text-center">
          <MapPin className="w-8 h-8 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/40">
            Selecione uma cidade para ver preços e gráficos detalhados
          </p>
        </div>
      )}
    </div>
  );
}
