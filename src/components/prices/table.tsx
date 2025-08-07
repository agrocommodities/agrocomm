"use client";

import Image from "next/image";

interface QuotationData {
  id: number;
  price: number;
  date: string;
  variation: number | null;
  stateCode: string;
  stateName: string;
  cityName: string | null;
}

interface QuotationTableProps {
  data: QuotationData[];
  commodity: string;
  onSort?: (field: string) => void;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
}

const COMMODITY_UNITS: Record<string, string> = {
  'soja': 'saca',
  'milho': 'saca', 
  'boi': 'arroba',
  'vaca': 'arroba',
  'arroba-boi': 'arroba',
  'arroba-vaca': 'arroba',
};

export function QuotationTable({ data, commodity, onSort, sortField, sortDirection }: QuotationTableProps) {
  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace('.', ',');
  };

  const formatVariation = (variation: number) => {
    const percentage = variation / 100;
    return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getCommodityUnit = (commodity: string) => {
    return COMMODITY_UNITS[commodity.toLowerCase()] || 'unidade';
  };

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field);
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field) {
      return (
        <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return (
      <svg 
        className={`w-4 h-4 text-white transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    );
  };

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg shadow-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-black/30">
            <tr>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleSort('state')}
              >
                <div className="flex items-center gap-2">
                  Estado
                  <SortIcon field="state" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleSort('city')}
              >
                <div className="flex items-center gap-2">
                  Cidade
                  <SortIcon field="city" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleSort('price')}
              >
                <div className="flex items-center justify-end gap-2">
                  Preço
                  <SortIcon field="price" />
                </div>
              </th>
              <th 
                className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => handleSort('variation')}
              >
                <div className="flex items-center justify-end gap-2">
                  Variação
                  <SortIcon field="variation" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {data.length > 0 ? (
              data.map((item, index) => {
                const isPositive = item.variation && item.variation > 0;
                
                return (
                  <tr 
                    key={`${item.id}-${index}`} 
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={`/images/bandeiras/square-rounded/${item.stateCode.toLowerCase()}.png`}
                            alt={`Bandeira ${item.stateCode}`}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {item.stateName}
                          </div>
                          <div className="text-sm text-white/60">
                            {item.stateCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-white">
                        {item.cityName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-lg font-semibold text-white">
                        R$ {formatPrice(item.price)}
                      </div>
                      <div className="text-xs text-white/60">
                        por {getCommodityUnit(commodity)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {item.variation !== null ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Math.abs(item.variation) < 1
                            ? "bg-white/20 text-white/70"
                            : isPositive
                            ? "bg-green-500/20 text-green-300"
                            : "bg-red-500/20 text-red-300"
                        }`}>
                          {Math.abs(item.variation) < 1 
                            ? "=" 
                            : formatVariation(item.variation)
                          }
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/70">
                          -
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-white/60">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                    </svg>
                    <p>Nenhuma cotação encontrada para esta data</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}