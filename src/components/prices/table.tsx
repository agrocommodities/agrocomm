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
};

const STATE_NAMES: Record<string, string> = {
  'AC': 'Acre',
  'AL': 'Alagoas',
  'AP': 'Amapá',
  'AM': 'Amazonas',
  'BA': 'Bahia',
  'CE': 'Ceará',
  'DF': 'Distrito Federal',
  'ES': 'Espírito Santo',
  'GO': 'Goiás',
  'MA': 'Maranhão',
  'MT': 'Mato Grosso',
  'MS': 'Mato Grosso do Sul',
  'MG': 'Minas Gerais',
  'PA': 'Pará',
  'PB': 'Paraíba',
  'PR': 'Paraná',
  'PE': 'Pernambuco',
  'PI': 'Piauí',
  'RJ': 'Rio de Janeiro',
  'RN': 'Rio Grande do Norte',
  'RS': 'Rio Grande do Sul',
  'RO': 'Rondônia',
  'RR': 'Roraima',
  'SC': 'Santa Catarina',
  'SP': 'São Paulo',
  'SE': 'Sergipe',
  'TO': 'Tocantins',
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

  const getFullStateName = (stateCode: string) => {
    return STATE_NAMES[stateCode.toUpperCase()] || stateCode;
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
    <>
      {/* Versão Desktop - Tabela Completa */}
      <div className="hidden sm:block bg-background/80 border-2 border-white/20 rounded-lg shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('state')}
                >
                  <div className="flex items-center gap-2">
                    Estado
                    <SortIcon field="state" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-left text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('city')}
                >
                  <div className="flex items-center gap-2">
                    Cidade
                    <SortIcon field="city" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-2">
                    Preço
                    <SortIcon field="price" />
                  </div>
                </th>
                <th 
                  className="px-6 py-4 text-right text-xs font-medium text-white/70 uppercase tracking-wider cursor-pointer hover:bg-white/5"
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
                  const fullStateName = getFullStateName(item.stateCode);
                  
                  return (
                    <tr 
                      key={`${item.id}-${index}`} 
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Image
                            src={`/images/bandeiras/square-rounded/${item.stateCode.toLowerCase()}.svg`}
                            alt={`Bandeira ${item.stateCode}`}
                            width={24}
                            height={24}
                            className="w-6 h-6 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div>
                            <div className="text-sm font-medium text-white">
                              {fullStateName}
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
                          R$ {formatPrice(item.price)} <span className="text-xs text-white/60">({getCommodityUnit(commodity)})</span>
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

      {/* Versão Mobile - Cards */}
      <div className="sm:hidden space-y-3">
        {data.length > 0 ? (
          data.map((item, index) => {
            const isPositive = item.variation && item.variation > 0;
            const fullStateName = getFullStateName(item.stateCode);
            
            return (
              <div 
                key={`${item.id}-${index}`}
                className="bg-background/80 border-2 border-white/20 rounded-lg p-4"
              >
                {/* Cabeçalho com Estado e Bandeira */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Image
                      src={`/images/bandeiras/square-rounded/${item.stateCode.toLowerCase()}.svg`}
                      alt={`Bandeira ${item.stateCode}`}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <div>
                      <div className="text-sm font-medium text-white">
                        {fullStateName} ({item.stateCode})
                      </div>
                      {item.cityName && (
                        <div className="text-xs text-white/60">
                          {item.cityName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Preço e Variação */}
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-white/60 mb-1">Preço</div>
                    <div className="text-xl font-bold text-white">
                      R$ {formatPrice(item.price)} <span className="text-xs text-white/60">({getCommodityUnit(commodity)})</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 mb-1">Variação</div>
                    {item.variation !== null ? (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        Math.abs(item.variation) < 1
                          ? "bg-white/20 text-white/70"
                          : isPositive
                          ? "bg-green-500/20 text-green-300"
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {Math.abs(item.variation) < 1 
                          ? "Estável" 
                          : formatVariation(item.variation)
                        }
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white/70">
                        -
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-background/80 border-2 border-white/20 rounded-lg p-8 text-center">
            <svg className="w-12 h-12 text-white/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <p className="text-white/60">Nenhuma cotação encontrada para esta data</p>
          </div>
        )}
      </div>
    </>
  );
}