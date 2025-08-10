"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { DatePicker } from "@/components/ui/datepicker";
import { StateSelect } from "@/components/ui/state-select";
import { QuotationTable } from "@/components/prices/table";

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
    cityName: string | null;
  }>;
  availableDates: string[];
  selectedDate: string;
  selectedState: string;
  average: string;
}

export function QuotationClient({ commodity, states, prices, availableDates, selectedDate, selectedState, average }: QuotationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<string>('state');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleStateChange = (state: string) => {
    console.log(`Mudando para estado: ${state}`); // Debug
    
    const params = new URLSearchParams(searchParams);
    if (state === "all") {
      params.delete("state");
    } else {
      params.set("state", state);
    }
    
    const newUrl = `/cotacoes/${commodity}?${params.toString()}`;
    console.log(`Nova URL: ${newUrl}`); // Debug
    
    router.push(newUrl);
  };

  const handleDateChange = (date: string) => {
    console.log(`Mudando para data: ${date}`); // Debug
    
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    
    const newUrl = `/cotacoes/${commodity}?${params.toString()}`;
    console.log(`Nova URL: ${newUrl}`); // Debug
    
    router.push(newUrl);
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
      'arroba-boi': 'Arroba do Boi',
      'arroba-vaca': 'Arroba da Vaca',
    };
    return titles[commodity.toLowerCase()] || commodity.charAt(0).toUpperCase() + commodity.slice(1);
  };

  // Debug dos dados recebidos
  console.log('QuotationClient - Props:', {
    commodity,
    selectedState,
    selectedDate,
    statesCount: states.length,
    pricesCount: prices.length,
  });

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-background/80 border-2 border-white/20 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Estado
            </label>
            <StateSelect
              states={states}
              selectedState={selectedState}
              onStateChange={handleStateChange}
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

      {/* Resumo */}
      <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Resumo - {getCommodityTitle(commodity)}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-1">Cotações encontradas</p>
            <p className="text-2xl font-bold text-white">
              {prices.length}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-1">Preço médio</p>
            <p className="text-2xl font-bold text-white">
              R$ {average}
            </p>
          </div>
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-1">Data selecionada</p>
            <p className="text-lg font-semibold text-white">
              {formatDate(selectedDate)}
            </p>
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