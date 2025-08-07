"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface QuotationClientProps {
  commodity: string;
  states: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  prices: Array<{
    id: number;
    price: number;
    date: string;
    variation: number | null;
    stateCode: string;
    stateName: string;
    stateId: number;
    cityName: string | null;
    cityId: number | null;
  }>;
  availableDates: string[];
  selectedDate: string;
  selectedState: string;
  average: string;
}

export function QuotationClient({
  commodity,
  states,
  prices,
  availableDates,
  selectedDate,
  selectedState,
  average,
}: QuotationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleStateChange = (state: string) => {
    const params = new URLSearchParams(searchParams);
    if (state === "all") {
      params.delete("state");
    } else {
      params.set("state", state);
    }
    router.push(`/cotacoes/${commodity}?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    setShowCalendar(false);
    router.push(`/cotacoes/${commodity}?${params.toString()}`);
  };

  const formatDate = (dateStr: string) => {
    try {
      // Garantir que a data esteja no formato YYYY-MM-DD
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return dateStr;
    }
  };

  const formatShortDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      });
    } catch (error) {
      return dateStr.slice(-5); // Fallback para MM-DD
    }
  };

  // const formatPrice = (priceInCents: number) => {
  //   return (priceInCents / 100).toFixed(2).replace('.', ',');
  // };

  // const formatVariation = (variation: number) => {
  //   const percentage = variation / 100;
  //   return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  // };

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace('.', ',');
  };

  const formatVariation = (variation: number) => {
    const percentage = variation / 100; // Converter pontos base para %
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };



  const getCalendarDays = () => {
    try {
      const [year, month, day] = selectedDate.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      const currentYear = date.getFullYear();
      const currentMonth = date.getMonth();
      
      const firstDay = new Date(currentYear, currentMonth, 1);
      const lastDay = new Date(currentYear, currentMonth + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startingDayOfWeek = firstDay.getDay();
      
      const days = [];
      
      for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(null);
      }
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        days.push({
          day: i,
          date: dateStr,
          hasQuotation: availableDates.includes(dateStr),
          isSelected: dateStr === selectedDate,
        });
      }
      
      return days;
    } catch (error) {
      console.error("Erro ao gerar calendário:", error);
      return [];
    }
  };

  const monthYear = (() => {
    try {
      const [year, month] = selectedDate.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, 1);
      return date.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      });
    } catch (error) {
      return selectedDate;
    }
  })();

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-background/80 border-2 border-white/20 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="state-filter" className="block text-sm font-medium mb-2 text-white">
              Estado
            </label>
            <select
              id="state-filter"
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-2 border-2 border-white/20 rounded-lg bg-black/30 text-white focus:ring-2 focus:ring-white/50 focus:border-white/50"
            >
              <option value="all">Todos os estados</option>
              {states.map((state) => (
                <option key={state.id} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">Data</label>
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-2 border-2 border-white/20 rounded-lg bg-black/30 text-left focus:ring-2 focus:ring-white/50 focus:border-white/50 flex items-center justify-between text-white"
              >
                <span>{formatDate(selectedDate)}</span>
                <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              {showCalendar && (
                <div className="absolute z-20 mt-2 w-full bg-background border-2 border-white/20 rounded-lg shadow-xl p-4">
                  <div className="text-center font-semibold mb-4 capitalize text-white">
                    {monthYear}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-white/70">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {getCalendarDays().map((day, i) => (
                      <div key={i}>
                        {day ? (
                          <button
                            onClick={() => handleDateChange(day.date)}
                            disabled={!day.hasQuotation}
                            className={`
                              w-full aspect-square rounded-lg text-sm transition-colors
                              ${day.hasQuotation
                                ? day.isSelected
                                  ? "bg-white text-background font-semibold"
                                  : "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-white/10 text-white/40 cursor-not-allowed"
                              }
                            `}
                          >
                            {day.day}
                          </button>
                        ) : (
                          <div />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resumo */}
      <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-white/70">Cotações encontradas</p>
            <p className="text-2xl font-bold text-white">
              {prices.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/70">Preço médio</p>
            <p className="text-2xl font-bold text-white">
              R$ {average}
            </p>
          </div>
          <div>
            <p className="text-sm text-white/70">Data selecionada</p>
            <p className="text-lg font-semibold text-white">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Cotações */}
      <div className="bg-background/80 border-2 border-white/20 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white/70 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-white/70 uppercase tracking-wider">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {prices.length > 0 ? (
                prices.map((price) => {
                  const isPositive = price.variation && price.variation > 0 ? true : false;
                  
                  return (
                    <tr key={price.id} className="hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-white">
                            {price.stateName}
                          </div>
                          <div className="text-sm text-white/60">
                            {price.stateCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">
                          {price.cityName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-lg font-semibold text-white">
                          R$ {formatPrice(price.price)}
                        </div>
                        <div className="text-xs text-white/60">
                          por {commodity}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Math.abs(price.variation || 0) < 1
                            ? "bg-white/20 text-white/70"
                            : isPositive
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {Math.abs(price.variation || 0) < 1 
                            ? "=" 
                            : formatVariation(price.variation || 0)
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-white/60">
                    Nenhuma cotação encontrada para esta data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navegação */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link
          href="/cotacoes"
          className="inline-flex items-center px-4 py-2 border-2 border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-black/30 hover:bg-black/50 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <span className="text-sm text-white/60 self-center mr-2">
            Datas recentes:
          </span>
          {availableDates.slice(0, 5).map((date) => (
            <button
              key={date}
              onClick={() => handleDateChange(date)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                date === selectedDate
                  ? "bg-white text-background"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              {formatShortDate(date)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}