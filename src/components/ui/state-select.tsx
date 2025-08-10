"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import Image from "next/image";

interface State {
  id: number;
  code: string;
  name: string;
}

interface StateSelectProps {
  states: State[];
  selectedState: string;
  onStateChange: (state: string) => void;
  className?: string;
  prices?: Array<{ stateCode: string }>; // Para contar cotações por estado
  showPriceCount?: boolean; // Opção para mostrar contador
}

// Mapeamento dos códigos dos estados para nomes completos
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

export function StateSelect({ 
  states, 
  selectedState, 
  onStateChange, 
  className = "",
  prices = [],
  showPriceCount = false
}: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Função para contar cotações por estado
  const getPriceCountForState = (stateCode: string) => {
    if (!showPriceCount || !prices.length) return 0;
    return prices.filter(price => price.stateCode === stateCode).length;
  };

  // Função para contar total de cotações
  const getTotalPriceCount = () => {
    return prices.length;
  };

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    STATE_NAMES[state.code]?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ordenar estados por número de cotações (descendente) e depois por nome
  const sortedFilteredStates = [...filteredStates].sort((a, b) => {
    if (showPriceCount && prices.length > 0) {
      const countA = getPriceCountForState(a.code);
      const countB = getPriceCountForState(b.code);
      
      // Primeiro ordenar por quantidade de cotações (descendente)
      if (countB !== countA) {
        return countB - countA;
      }
    }
    
    // Se quantidade igual ou showPriceCount false, ordenar por nome
    const nameA = STATE_NAMES[a.code] || a.name;
    const nameB = STATE_NAMES[b.code] || b.name;
    return nameA.localeCompare(nameB);
  });

  const getSelectedStateData = () => {
    if (selectedState === "all" || !selectedState) {
      return { 
        name: "Todos os estados", 
        code: "br", 
        fullName: "Todos os estados",
        count: getTotalPriceCount()
      };
    }
    
    const foundState = states.find(s => s.code === selectedState);
    if (foundState) {
      return { 
        name: foundState.name, 
        code: foundState.code,
        fullName: STATE_NAMES[foundState.code] || foundState.name,
        count: getPriceCountForState(foundState.code)
      };
    }
    
    return { 
      name: "Selecione um estado...", 
      code: "", 
      fullName: "Selecione um estado...",
      count: 0
    };
  };

  const selectedStateData = getSelectedStateData();

  const handleSelect = (stateCode: string) => {
    console.log(`Selecionando estado: ${stateCode}`);
    onStateChange(stateCode);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  return (
    <div className={`relative ${className}`} ref={selectRef}>
      <button
        type="button"
        onClick={handleToggle}
        className="w-full px-4 py-3 border-2 border-white/20 rounded-lg bg-black/30 text-left focus:ring-2 focus:ring-white/50 focus:border-white/50 flex items-center justify-between text-white hover:bg-black/40 transition-colors"
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
              <Image
                src={`/images/bandeiras/square-rounded/${selectedStateData.code.toLowerCase()}.svg`}
                alt={`Bandeira ${selectedStateData.code || "br"}`}
                width={24}
                height={24}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><svg class="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>';
                  }
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-medium">
                  {selectedStateData.fullName}
                </span>
                {showPriceCount && selectedStateData.count > 0 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white/80">
                    {selectedStateData.count}
                  </span>
                )}
              </div>
              {selectedState !== "all" && selectedState && (
                <div className="text-xs text-white/60">
                  {selectedStateData.code.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-white/70 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full bg-background border-2 border-white/20 rounded-lg shadow-xl max-h-80 overflow-hidden">
          {/* Campo de busca */}
          <div className="p-3 border-b border-white/20">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar estado..."
              className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-md text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
            />
          </div>

          {/* Informação sobre filtro */}
          {states.length > 0 && (
            <div className="px-4 py-2 text-xs text-white/60 border-b border-white/20">
              Mostrando apenas estados com cotações disponíveis ({states.length} estados)
            </div>
          )}

          {/* Lista de estados */}
          <div className="overflow-y-auto max-h-64">
            {/* Opção "Todos os estados" */}
            <button
              type="button"
              onClick={() => handleSelect("all")}
              className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${
                selectedState === "all" ? "bg-white/20" : ""
              }`}
            >
              <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                <Image
                  src="/images/bandeiras/square-rounded/br.svg"
                  alt="Bandeira do Brasil"
                  width={24}
                  height={24}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      parent.innerHTML = '<div class="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><svg class="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>';
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium">Todos os estados</span>
                  {showPriceCount && getTotalPriceCount() > 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-300">
                      {getTotalPriceCount()} total
                    </span>
                  )}
                </div>
              </div>
            </button>

            {/* Estados filtrados */}
            {sortedFilteredStates.map((state) => {
              const fullStateName = STATE_NAMES[state.code] || state.name;
              const priceCount = getPriceCountForState(state.code);
              
              return (
                <button
                  key={state.id}
                  type="button"
                  onClick={() => handleSelect(state.code)}
                  className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 ${
                    selectedState === state.code ? "bg-white/20" : ""
                  }`}
                >
                  <div className="w-6 h-6 rounded overflow-hidden flex-shrink-0">
                    <Image
                      src={`/images/bandeiras/square-rounded/${state.code.toLowerCase()}.svg`}
                      alt={`Bandeira ${state.code}`}
                      width={24}
                      height={24}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent) {
                          parent.innerHTML = '<div class="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><svg class="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>';
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white font-medium">{fullStateName}</div>
                        <div className="text-white/60 text-sm">{state.code}</div>
                      </div>
                      {showPriceCount && priceCount > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-500/20 text-blue-300 ml-2">
                          {priceCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {sortedFilteredStates.length === 0 && (
              <div className="px-4 py-3 text-white/60 text-center">
                {searchTerm ? "Nenhum estado encontrado" : "Nenhum estado tem cotações disponíveis"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}