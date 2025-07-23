"use client";

import { useEffect, useState } from 'react';

interface PriceVariationAnimatedProps {
  variation: number;
  className?: string;
}

export function PriceVariationAnimated({ variation, className = "" }: PriceVariationAnimatedProps) {
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    if (variation !== 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [variation]);
  
  if (variation === 0) {
    return (
      <div className={`inline-flex items-center gap-2 px-1 py-1 rounded-sm bg-black/20 text-white/50 ${className}`}>
        <div className="w-4 h-4 flex items-center justify-center">
          <div className="w-3 h-0.5 bg-gray-400 rounded"></div>
        </div>
        <span className="text-xs">Estável</span>
      </div>
    );
  }
  
  const percentage = Math.abs(variation / 100).toFixed(2);
  const isPositive = variation > 0;
  
  return (
    <div className={`inline-flex items-center gap-2 px-2 py-1 rounded-lg transition-all duration-300 ${
      isPositive 
        ? 'bg-green-100 text-green-700 hover:bg-green-200' 
        : 'bg-red-100 text-red-700 hover:bg-red-200'
    } ${className}`}>
      <div className={`w-4 h-4 flex items-center justify-center ${isAnimating ? 'animate-bounce' : ''}`}>
        {isPositive ? (
          // Ícone de alta com animação
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2l5 5h-3v6h-4V7H3l5-5z" />
          </svg>
        ) : (
          // Ícone de baixa com animação  
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 14l-5-5h3V3h4v6h3l-5 5z" />
          </svg>
        )}
      </div>
      <span className="text-xs font-semibold">
        {isPositive ? '+' : '-'}{percentage}%
      </span>
    </div>
  );
}