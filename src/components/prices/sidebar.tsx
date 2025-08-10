"use client";

import { DatePicker } from "@/components/ui/datepicker";
import { StateSelect } from "@/components/ui/state-select";

interface State {
  id: number;
  code: string;
  name: string;
}

interface Price {
  id: number;
  price: number;
  date: string;
  variation: number | null;
  stateCode: string;
  stateName: string;
  cityName: string | null;
}

interface SidebarProps {
  states: State[];
  selectedState: string;
  selectedDate: string;
  availableDates: string[];
  onStateChange: (state: string) => void;
  onDateChange: (date: string) => void;
  commodity: string;
  average: string;
  pricesCount: number;
  prices: Price[]; // Adicionando prices para passar ao StateSelect
}

export function QuotationSidebar({
  states,
  selectedState,
  selectedDate,
  availableDates,
  onStateChange,
  onDateChange,
  commodity,
  average,
  pricesCount,
  prices,
}: SidebarProps) {
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

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="bg-white/10 border-2 border-white/20 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-4">
          Resumo - {getCommodityTitle(commodity)}
        </h3>
        <div className="space-y-4">
          <div className="bg-black/20 rounded-lg p-4">
            <p className="text-sm text-white/70 mb-1">Cotações encontradas</p>
            <p className="text-2xl font-bold text-white">
              {pricesCount}
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

      {/* Filtros */}
      <div className="bg-background/80 border-2 border-white/20 p-6 rounded-lg shadow-lg">
        <h2 className="text-lg font-semibold mb-4 text-white">Filtros</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-white">
              Estado
            </label>
            <StateSelect
              states={states}
              selectedState={selectedState}
              onStateChange={onStateChange}
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
              onDateChange={onDateChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}