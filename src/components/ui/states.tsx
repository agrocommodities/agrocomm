"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import { states } from "@/config";
import { type State } from "@/types";

interface StateDropdownProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function StateDropdown({ isOpen = false, onToggle }: StateDropdownProps) {
  // const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState<State | null>(null);

  // Carrega o estado salvo ao montar o componente
  useEffect(() => {
    const savedState = localStorage.getItem("selectedState");
    if (savedState) {
      setSelectedState(JSON.parse(savedState));
    }
  }, []);

  // Salva o estado sempre que mudar
  useEffect(() => {
    if (selectedState) {
      localStorage.setItem("selectedState", JSON.stringify(selectedState));
    }
  }, [selectedState]);

  const handleSelect = (state: State) => {
    setSelectedState(state);
    onToggle?.(); // Fecha o menu após seleção
    redirect(`/estado/${state.abbr.toLowerCase()}`);
  };

  // // Carrega o estado salvo ao montar o componente
  // useEffect(() => {
  //   const savedState = localStorage.getItem("selectedState");
  //   if (savedEstado) {
  //     setSelectedEstado(JSON.parse(savedEstado));
  //   }
  // }, []);

  // //Salva o estado sempre que mudar
  // useEffect(() => {
  //   if (selectedEstado) {
  //     localStorage.setItem("selectedEstado", JSON.stringify(selectedEstado));
  //   }
  // }, [selectedEstado]);

  // const toggleDropdown = () => setIsOpen(!isOpen);

  // const handleSelect = (estado: Estado) => {
  //   setSelectedEstado(estado);
  //   setIsOpen(false);
  //   redirect(`/estado/${estado.sigla.toLowerCase()}`);
  // };

  return (
    <div className="relative w-full max-w-md">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3 py-1 text-left bg-black rounded-md shadow-sm focus:outline-none"
      >
        {selectedState ? (
          <div className="flex items-center">
            <img
              src={`/images/bandeiras/square-rounded/${selectedState.abbr.toLowerCase()}.svg`}
              alt={`Bandeira de ${selectedState.name}`}
              className="w-6 h-4 mr-2 object-cover"
            />
            <span>
              {selectedState.name} ({selectedState.abbr})
            </span>
          </div>
        ) : (
          <span>Selecione um estado</span>
        )}
        <svg
          className={`w-5 h-5 ml-2 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""
            }`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-black rounded-md shadow-lg max-h-96 overflow-y-auto">
          <ul className="py-1">
            {states.map((state) => (
              <li
                key={state.abbr}
                onClick={() => handleSelect(state)}
                className="flex items-center px-3 py-1 cursor-pointer hover:bg-white/20"
              >
                <img
                  src={`/images/bandeiras/square-rounded/${state.abbr.toLowerCase()}.svg`}
                  alt={`Bandeira de ${state.name}`}
                  className="w-6 h-4 mr-2 object-cover"
                />
                <span className="text-sm/8">{state.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
