"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Password({ className = "", ...props }) {
  const [isVisible, setIsVisible] = useState(false);
  const toggleVisibility = () => setIsVisible(prevState => !prevState);

  return (
    <div className="relative">
      <input
        type={isVisible ? "text" : "password"}
        className={`
          block w-full min-w-0 grow p-2.5 text-base dark:text-white
          placeholder:text-gray-400 focus:outline-none
          rounded-lg border-2 border-black/80 focus:border-black/80 
          bg-black/50 dark:bg-black/70 dark:placeholder-gray-400   
          appearance-none
          ${className}
        `.trim()}
        aria-label="Senha"
        required
        {...props}
      />
      <button
        className="absolute inset-y-0 end-0 flex items-center z-20 px-2.5 cursor-pointer text-gray-400 rounded-e-md focus:outline-none focus-visible:text-indigo-500 hover:text-indigo-500 transition-colors"
        type="button"
        onClick={toggleVisibility}
        aria-label={isVisible ? "Ocultar senha" : "Mostrar senha"}
        aria-pressed={isVisible}
        aria-controls="password"
      >
        {isVisible ? (
          <EyeOff size={20} aria-hidden="true" />
        ) : (
          <Eye size={20} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}