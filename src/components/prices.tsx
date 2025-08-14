"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QuotationTable } from "@/components/prices/table";
import { DatePicker } from "@/components/ui/datepicker";
import { StateSelect } from "@/components/ui/state-select";
import { PriceChart } from "@/components/prices/chart";
import type { QuotationClientProps } from "@/types";

export function QuotationClient({ commodity, states, prices, availableDates, selectedDate, selectedState, average }: QuotationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<string>('state');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    router.push(`/cotacoes/${commodity}?${params.toString()}`);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch (error) {
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
      return dateStr.slice(-5);
    }
  };

  // Ordenar dados
  const sortedPrices = [...prices].sort((a, b) => {
    let comparison = 0;
    
    switch (sortField) {
      case 'state':
        comparison = a.stateName.localeCompare(b.stateName);
        break;
      case 'city':
        comparison = (a.cityName || '').localeCompare(b.cityName || '');
        break;
      case 'price':
        comparison = a.price - b.price;
        break;
      case 'variation':
        comparison = (a.variation || 0) - (b.variation || 0);
        break;
    }
    
    return sortDirection === 'desc' ? -comparison : comparison;
  });

  const getCommodityTitle = (commodity: string) => {
    const titles: Record<string, string> = {
      'soja': 'Soja',
      'milho': 'Milho',
      'boi': 'Boi Gordo',
      'vaca': 'Vaca Gorda',
    };
    return titles[commodity.toLowerCase()] || commodity.charAt(0).toUpperCase() + commodity.slice(1);
  };

  // Mapear dados para o formato esperado pelo PriceChart
  const chartData = prices.map(price => ({
    id: price.id,
    price: price.price,
    date: price.date,
    variation: price.variation,
    state: price.stateCode, // Mapear stateCode para state
    city: price.cityName || "", // Mapear cityName para city com fallback
    commodity: commodity
  }));

  return (
    <div className="space-y-6">
      {/* Filtros - Layout Responsivo */}
      <div className="bg-background/80 border-2 border-white/20 p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Estado
            </label>
            <StateSelect
              states={states}
              selectedState={selectedState}
              onStateChange={handleStateChange}
              prices={prices}
              showPriceCount={true}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Data
            </label>
            <DatePicker
              selectedDate={selectedDate}
              availableDates={availableDates}
              onDateChange={handleDateChange}
            />
          </div>
        </div>
      </div>

      {/* Tabela de Cotações */}
      <QuotationTable
        data={sortedPrices}
        commodity={commodity}
        onSort={handleSort}
        sortField={sortField}
        sortDirection={sortDirection}
      />

      {/* Gráfico de Preços */}
      <PriceChart 
        data={chartData} // Usar dados mapeados
        commodity={commodity} 
        selectedState={selectedState}
      />

      {/* Card de Resumo - Compacto */}
      <div className="bg-white/10 border-2 border-white/20 p-4 rounded-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-xs sm:text-sm text-white/70">Cotações</p>
            <p className="text-xl sm:text-2xl font-bold text-white">{prices.length}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-white/70">Preço médio</p>
            <p className="text-xl sm:text-2xl font-bold text-white">R$ {average}</p>
          </div>
          <div>
            <p className="text-xs sm:text-sm text-white/70">Data</p>
            <p className="text-sm sm:text-base font-semibold text-white">
              {formatDate(selectedDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Navegação e Datas Rápidas */}
      <div className="flex flex-col gap-4">
        {/* Datas Rápidas */}
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="text-sm text-white/60 self-center">
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

        {/* Botão Voltar */}
        <div className="flex justify-center">
          <Link
            href="/cotacoes"
            className="inline-flex items-center px-4 py-2 border-2 border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-black/30 hover:bg-black/50 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
        </div>
      </div>
    </div>
  );
}