// src/components/ui/price-variation.tsx
interface PriceVariationProps {
  variation: number;
  className?: string;
}

export function PriceVariation({ variation, className = "" }: PriceVariationProps) {
  if (variation === 0) {
    return <span className={`text-gray-500 text-sm ${className}`}>—</span>;
  }
  
  const percentage = (variation / 100).toFixed(2);
  const isPositive = variation > 0;
  
  return (
    <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'} ${className}`}>
      {isPositive ? '+' : ''}{percentage}%
    </span>
  );
}