// src/components/prices/latest-prices.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TrendingUp, TrendingDown, BarChart3, Minus } from "lucide-react";

interface PriceItem {
  commodity: string;
  avgPrice: number;
  avgVariation: number;
  count: number;
  lastUpdate: string;
}

interface LatestPricesProps {
  limit?: number;
}

const COMMODITY_NAMES: Record<string, string> = {
  'soja': 'Soja',
  'milho': 'Milho',
  'boi': 'Boi Gordo',
  'vaca': 'Vaca Gorda',
};

export function LatestPrices({ limit = 10 }: LatestPricesProps) {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/api/prices/summary?limit=${limit}`);
        if (response.ok) {
          const data = await response.json();
          setPrices(data);
        }
      } catch (err) {
        console.error("Erro ao carregar cotações:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [limit]);

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const formatVariation = (variation: number) => {
    if (Math.abs(variation) < 1) return null;
    const percentage = variation / 100;
    return `${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`;
  };

  const getVariationIcon = (variation: number) => {
    if (Math.abs(variation) < 1) return <Minus className="w-3 h-3" />;
    return variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getVariationColor = (variation: number) => {
    if (Math.abs(variation) < 1) return "text-white/60";
    return variation > 0 ? "text-green-400" : "text-red-400";
  };

  if (loading) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Resumo de Cotações
        </h3>
        <div className="animate-pulse space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5" />
        Resumo de Cotações
      </h3>
      
      <div className="space-y-3">
        {prices.map((item) => (
          <Link 
            key={item.commodity}
            href={`/cotacoes/${item.commodity}`}
            className="block hover:bg-white/5 p-3 rounded transition-colors group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-white group-hover:text-green-400 transition-colors">
                  {COMMODITY_NAMES[item.commodity] || item.commodity}
                </h4>
                <p className="text-xs text-white/60">{item.count} cotações</p>
              </div>
              
              <div className="text-right">
                <p className="text-sm font-bold text-white">
                  R$ {formatPrice(item.avgPrice)}
                </p>
                {formatVariation(item.avgVariation) && (
                  <p className={`text-xs flex items-center gap-1 justify-end ${getVariationColor(item.avgVariation)}`}>
                    {getVariationIcon(item.avgVariation)}
                    {formatVariation(item.avgVariation)}
                  </p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
      
      {prices.length === 0 && !loading && (
        <p className="text-white/60 text-sm text-center py-4">
          Nenhuma cotação disponível
        </p>
      )}
      
      <div className="mt-4 pt-3 border-t border-white/20">
        <Link 
          href="/cotacoes" 
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          Ver todas as cotações →
        </Link>
      </div>
    </div>
  );
}