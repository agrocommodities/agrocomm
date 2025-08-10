"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { QuotationTable } from "@/components/prices/table";
import { QuotationSidebar } from "@/components/prices/sidebar";

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

export function QuotationClient({ 
  commodity, 
  states, 
  prices, 
  availableDates, 
  selectedDate, 
  selectedState, 
  average 
}: QuotationClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [sortField, setSortField] = useState<string>('state');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleStateChange = (state: string) => {
    console.log(`Mudando para estado: ${state}`);
    
    const params = new URLSearchParams(searchParams);
    if (state === "all") {
      params.delete("state");
    } else {
      params.set("state", state);
    }
    
    const newUrl = `/cotacoes/${commodity}?${params.toString()}`;
    console.log(`Nova URL: ${newUrl}`);
    
    router.push(newUrl);
  };

  const handleDateChange = (date: string) => {
    console.log(`Mudando para data: ${date}`);
    
    const params = new URLSearchParams(searchParams);
    params.set("date", date);
    
    const newUrl = `/cotacoes/${commodity}?${params.toString()}`;
    console.log(`Nova URL: ${newUrl}`);
    
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

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sidebar Mobile Toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-full px-4 py-3 bg-background/80 border-2 border-white/20 rounded-lg text-white font-medium hover:bg-black/50 transition-colors flex items-center justify-between"
        >
          <span>Filtros e Resumo</span>
          <svg 
            className={`w-5 h-5 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute top-0 right-0 h-full w-80 max-w-[85vw] bg-background border-l-2 border-white/20 overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-white">Filtros e Resumo</h3>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 text-white/70 hover:text-white rounded-md hover:bg-white/10 transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <QuotationSidebar
                  states={states}
                  selectedState={selectedState}
                  selectedDate={selectedDate}
                  availableDates={availableDates}
                  onStateChange={handleStateChange}
                  onDateChange={handleDateChange}
                  commodity={commodity}
                  average={average}
                  pricesCount={prices.length}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Mobile filters collapsed state (mostrar apenas resumo compacto) */}
        <div className={`lg:hidden ${sidebarOpen ? 'hidden' : 'block'}`}>
          <div className="bg-white/10 border-2 border-white/20 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm text-white">
              <span>{prices.length} cotações</span>
              <span>Média: R$ {average}</span>
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

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-80 flex-shrink-0">
        <QuotationSidebar
          states={states}
          selectedState={selectedState}
          selectedDate={selectedDate}
          availableDates={availableDates}
          onStateChange={handleStateChange}
          onDateChange={handleDateChange}
          commodity={commodity}
          average={average}
          pricesCount={prices.length}
        />
      </div>
    </div>
  );
}