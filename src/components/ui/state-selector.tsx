// src/components/ui/state-selector.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { redirect } from "next/navigation";
import { states } from "@/config";
import type { State } from "@/types";

interface StateSelectorProps {
  isMobile?: boolean;
}

export function StateSelector({ isMobile = false }: StateSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEstado, setSelectedEstado] = useState<State | null>(null);
  const selectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedEstado = localStorage.getItem("selectedEstado");
    if (savedEstado) {
      setSelectedEstado(JSON.parse(savedEstado));
    }
  }, []);

  useEffect(() => {
    if (selectedEstado) {
      localStorage.setItem("selectedEstado", JSON.stringify(selectedEstado));
    }
  }, [selectedEstado]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelect = (estado: State) => {
    setSelectedEstado(estado);
    setIsOpen(false);
    redirect(`/estado/${estado.abbr.toLowerCase()}`);
  };

  if (isMobile) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 px-4 py-2">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Localização</span>
        </div>
        
        <div className="relative" ref={selectorRef}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-between w-full p-3 bg-foreground/5 rounded-lg hover:bg-foreground/10 transition-colors"
          >
            {selectedEstado ? (
              <div className="flex items-center gap-2">
                <img
                  src={`/images/bandeiras/square-rounded/${selectedEstado.abbr.toLowerCase()}.svg`}
                  alt={`Bandeira de ${selectedEstado.name}`}
                  className="w-5 h-4 object-cover rounded"
                />
                <span className="text-sm">{selectedEstado.name}</span>
              </div>
            ) : (
              <span className="text-sm text-foreground/60">Selecione um estado</span>
            )}
            <ChevronDown 
              className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-foreground/10 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
              {states.map((estado) => (
                <button
                  key={estado.abbr}
                  onClick={() => handleSelect(estado)}
                  className="flex items-center gap-2 w-full p-3 hover:bg-foreground/5 transition-colors text-left"
                >
                  <img
                    src={`/images/bandeiras/square-rounded/${estado.abbr.toLowerCase()}.svg`}
                    alt={`Bandeira de ${estado.name}`}
                    className="w-5 h-4 object-cover rounded"
                  />
                  <span className="text-sm">{estado.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative" ref={selectorRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-black/20 rounded-lg hover:bg-black/30 transition-colors"
      >
        {selectedEstado ? (
          <>
            <img
              src={`/images/bandeiras/square-rounded/${selectedEstado.abbr.toLowerCase()}.svg`}
              alt={`Bandeira de ${selectedEstado.name}`}
              className="w-4 h-3 object-cover rounded"
            />
            <span className="text-sm hidden lg:block">{selectedEstado.name}</span>
            <span className="text-sm lg:hidden">{selectedEstado.abbr}</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            <span className="text-sm hidden lg:block">Estado</span>
          </>
        )}
        <ChevronDown 
          className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-background border border-foreground/10 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50">
          {states.map((estado) => (
            <button
              key={estado.abbr}
              onClick={() => handleSelect(estado)}
              className="flex items-center gap-2 w-full p-2 hover:bg-foreground/5 transition-colors text-left"
            >
              <img
                src={`/images/bandeiras/square-rounded/${estado.abbr.toLowerCase()}.svg`}
                alt={`Bandeira de ${estado.name}`}
                className="w-4 h-3 object-cover rounded"
              />
              <span className="text-sm">{estado.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}