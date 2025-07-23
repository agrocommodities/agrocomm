// src/components/ui/price-variation-fancy.tsx
interface PriceVariationFancyProps {
  variation: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PriceVariationFancy({ 
  variation, 
  className = "",
  size = 'md'
}: PriceVariationFancyProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4', 
    lg: 'w-5 h-5'
  };
  
  if (variation === 0) {
    return (
      <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-gray-100 border border-gray-300 text-gray-600 ${className}`}>
        {/* Ícone de estabilidade (linha reta) */}
        <svg className={iconSize[size]} viewBox="0 0 16 16" fill="currentColor">
          <rect x="2" y="7" width="12" height="2" rx="1" />
        </svg>
        <span className="font-medium">Estável</span>
      </div>
    );
  }
  
  const percentage = Math.abs(variation / 100).toFixed(2);
  const isPositive = variation > 0;
  
  if (isPositive) {
    return (
      <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 text-green-700 ${className}`}>
        {/* Ícone de alta (foguete/seta para cima estilizada) */}
        <svg className={iconSize[size]} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1l3 6-1.5 1.5L8 7 6.5 8.5 5 7l3-6z" />
          <path d="M6 10l1 1v3l1-1 1 1v-3l1-1-2-2-2 2z" opacity="0.7" />
        </svg>
        <span className="font-semibold">+{percentage}%</span>
      </div>
    );
  } else {
    return (
      <div className={`inline-flex items-center gap-2 ${sizeClasses[size]} rounded-full bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 text-red-700 ${className}`}>
        {/* Ícone de baixa (seta para baixo estilizada) */}
        <svg className={iconSize[size]} viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15l-3-6 1.5-1.5L8 9l1.5-1.5L11 9l-3 6z" />
          <path d="M10 6l-1-1V2L8 3 7 2v3L6 6l2 2 2-2z" opacity="0.7" />
        </svg>
        <span className="font-semibold">-{percentage}%</span>
      </div>
    );
  }
}