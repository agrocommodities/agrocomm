// src/app/cotacoes/[slug]/quotation-client.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

interface QuotationClientProps {
  commodity: {
    id: number;
    name: string;
    slug: string;
    unit: string;
  };
  states: Array<{
    id: number;
    code: string;
    name: string;
  }>;
  prices: Array<{
    id: number;
    price: number;
    date: string;
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

  // Fechar calendário ao clicar fora
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
    router.push(`/cotacoes/${commodity.slug}?${params.toString()}`);
  };

  const handleDateChange = (date: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    setShowCalendar(false);
    router.push(`/cotacoes/${commodity.slug}?${params.toString()}`);
  };

  // Criar estrutura do calendário
  const getCalendarDays = () => {
    const date = new Date(selectedDate + "T12:00:00");
    const year = date.getFullYear();
    const month = date.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({
        day: i,
        date: dateStr,
        hasQuotation: availableDates.includes(dateStr),
        isSelected: dateStr === selectedDate,
      });
    }
    
    return days;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const monthYear = new Date(selectedDate + "T12:00:00").toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  // Agrupar preços por estado para melhor visualização
  const pricesByState = prices.reduce((acc, price) => {
    const key = price.stateCode;
    if (!acc[key]) {
      acc[key] = {
        stateName: price.stateName,
        stateCode: price.stateCode,
        cities: [],
      };
    }
    acc[key].cities.push(price);
    return acc;
  }, {} as Record<string, { stateName: string; stateCode: string; cities: typeof prices }>);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Filtro de Estado */}
          <div>
            <label htmlFor="state-filter" className="block text-sm font-medium mb-2">
              Estado
            </label>
            <select
              id="state-filter"
              value={selectedState}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">Todos os estados</option>
              {states.map((state) => (
                <option key={state.id} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de Data */}
          <div>
            <label className="block text-sm font-medium mb-2">Data</label>
            <div className="relative" ref={calendarRef}>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-left focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center justify-between"
              >
                <span>{formatDate(selectedDate)}</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              
              {showCalendar && (
                <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="text-center font-semibold mb-4 capitalize">
                    {monthYear}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
                      <div key={i} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
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
                                  ? "bg-green-600 text-white font-semibold hover:bg-green-700"
                                  : "bg-gray-100 dark:bg-gray-700 hover:bg-green-100 dark:hover:bg-green-900 text-gray-900 dark:text-white"
                                : "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed"
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
      <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Cotações encontradas</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {prices.length}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Preço médio</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              R$ {average}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Data selecionada</p>
            <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabela de Cotações */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Cidade
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Variação
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {prices.length > 0 ? (
                prices.map((price) => {
                  const variation = ((price.price - parseFloat(average)) / parseFloat(average) * 100).toFixed(2);
                  const isPositive = parseFloat(variation) > 0;
                  
                  return (
                    <tr key={price.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {price.stateName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {price.stateCode}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 dark:text-white">
                          {price.cityName || "-"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          R$ {price.price}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          por {commodity.unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Math.abs(parseFloat(variation)) < 0.01
                            ? "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                            : isPositive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                        }`}>
                          {Math.abs(parseFloat(variation)) < 0.01 
                            ? "=" 
                            : `${isPositive ? "+" : ""}${variation}%`
                          }
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    Nenhuma cotação encontrada para esta data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Navegação Rápida de Datas */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <Link
          href="/cotacoes"
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Voltar
        </Link>
        
        <div className="flex gap-2 flex-wrap justify-center">
          <span className="text-sm text-gray-500 dark:text-gray-400 self-center mr-2">
            Datas recentes:
          </span>
          {availableDates.slice(0, 5).map((date) => (
            <button
              key={date}
              onClick={() => handleDateChange(date)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                date === selectedDate
                  ? "bg-green-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
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