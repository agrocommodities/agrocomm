"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, MapPin } from "lucide-react";
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
}

export function StateSelect({ states, selectedState, onStateChange, className = "" }: StateSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const selectRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  console.log('StateSelect mounted with states:', states.length); // Debug
  console.log('StateSelect mounted with states:', states); // Debug

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

  const filteredStates = states.filter(state =>
    state.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    state.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Corrigir a lógica de seleção do estado
  const getSelectedStateData = () => {
    if (selectedState === "all" || !selectedState) {
      return { name: "Todos os estados", code: "br" };
    }
    
    const foundState = states.find(s => s.code === selectedState);
    if (foundState) return foundState;
    
    return { name: "Selecione um estado...", code: "" };
  };

  const selectedStateData = getSelectedStateData();

  const handleSelect = (stateCode: string) => {
    console.log(`Selecionando estado: ${stateCode}`); // Debug
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
                src={`/images/bandeiras/square-rounded/${selectedStateData.code.toLowerCase()}.svg` || "/images/bandeiras/square-rounded/br.svg"}
                alt={`Bandeira ${selectedStateData.code || "br"}`}
                width={24}
                height={24}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = 'none';
                  // Mostrar ícone de fallback
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-6 h-6 bg-white/20 rounded flex items-center justify-center"><svg class="w-4 h-4 text-white/60" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/></svg></div>';
                  }
                }}
              />
            </div>
            <span className="truncate">
              {selectedStateData.name}
              {selectedState !== "all" && selectedState && (
                <span className="text-white/60 ml-1">({selectedStateData.code.toUpperCase()})</span>
              )}
            </span>
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
              <span className="text-white">Todos os estados</span>
            </button>

            {/* Estados filtrados */}
            {filteredStates.map((state) => (
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
                  <div className="text-white font-medium">{state.name}</div>
                  <div className="text-white/60 text-sm">{state.code}</div>
                </div>
              </button>
            ))}

            {filteredStates.length === 0 && (
              <div className="px-4 py-3 text-white/60 text-center">
                Nenhum estado encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}