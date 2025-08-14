// src/components/prices/latest-prices.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, TrendingDown, BarChart3, Minus } from "lucide-react";

interface PriceItem {
  id: number;
  commodity: string;
  state: string;
  city: string;
  price: number;
  variation: number | null;
  date: string;
}

interface LatestPricesProps {
  variant?: "main" | "sidebar";
  limit?: number;
}

const COMMODITY_NAMES: Record<string, string> = {
  'soja': 'Soja',
  'milho': 'Milho',
  'boi': 'Boi Gordo',
  'vaca': 'Vaca Gorda',
};

const COMMODITY_IMAGES: Record<string, string> = {
  'soja': 'https://cdn.agrocomm.com.br/images/bg/daniela-paola-alchapar-AlqMN9ub3Aw-unsplash.jpg',
  'milho': 'https://cdn.agrocomm.com.br/images/bg/adrian-infernus-BN6iQEVN0ZQ-unsplash.jpg',
  'boi': '/images/boi.jpg',
  'vaca': '/images/vaca.jpg',
};

export function LatestPrices({ variant = "main", limit = 10 }: LatestPricesProps) {
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch(`/api/prices/latest?limit=${limit}`);
        if (!response.ok) throw new Error("Erro ao carregar cotações");
        
        const data = await response.json();
        setPrices(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, [limit]);

  const formatPrice = (priceInCents: number) => {
    return (priceInCents / 100).toFixed(2).replace(".", ",");
  };

  const formatVariation = (variation: number | null) => {
    if (variation === null || variation === 0) return null;
    const percentage = variation / 100;
    return `${percentage > 0 ? "+" : ""}${percentage.toFixed(2)}%`;
  };

  const getVariationIcon = (variation: number | null) => {
    if (!variation || Math.abs(variation) < 1) return <Minus className="w-3 h-3" />;
    return variation > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getVariationColor = (variation: number | null) => {
    if (!variation || Math.abs(variation) < 1) return "text-white/60";
    return variation > 0 ? "text-green-400" : "text-red-400";
  };

  if (loading) {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/20 border-2 border-red-500/50 rounded-lg p-4">
        <p className="text-red-300 text-sm">Erro ao carregar cotações: {error}</p>
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className="bg-background/80 border-2 border-white/20 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Últimas Cotações
        </h3>
        
        <div className="space-y-3">
          {prices.slice(0, 6).map((item) => (
            <div key={item.id} className="group">
              <Link 
                href={`/cotacoes/${item.commodity}`}
                className="block hover:bg-white/5 p-2 rounded transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded overflow-hidden flex-shrink-0">
                      <Image
                        src={`/images/bandeiras/square-rounded/${item.state.toLowerCase()}.svg`}
                        alt={`Bandeira ${item.state}`}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white group-hover:text-green-400 transition-colors">
                        {COMMODITY_NAMES[item.commodity] || item.commodity}
                      </p>
                      <p className="text-xs text-white/60">
                        {item.city}/{item.state}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm font-bold text-white">
                      R$ {formatPrice(item.price)}
                    </p>
                    {formatVariation(item.variation) && (
                      <p className={`text-xs flex items-center gap-1 ${getVariationColor(item.variation)}`}>
                        {getVariationIcon(item.variation)}
                        {formatVariation(item.variation)}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
        
        {prices.length === 0 && (
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

  // Variant main - resumo por commodity
  const commodityGroups = prices.reduce((acc, price) => {
    if (!acc[price.commodity]) {
      acc[price.commodity] = {
        commodity: price.commodity,
        prices: [],
        avgPrice: 0,
        avgVariation: 0,
        count: 0
      };
    }
    acc[price.commodity].prices.push(price);
    return acc;
  }, {} as Record<string, any>);

  // Calcular médias por commodity
  Object.values(commodityGroups).forEach((group: any) => {
    const validPrices = group.prices.filter((p: PriceItem) => p.price > 0);
    const validVariations = group.prices.filter((p: PriceItem) => p.variation !== null);
    
    group.avgPrice = validPrices.reduce((sum: number, p: PriceItem) => sum + p.price, 0) / validPrices.length;
    group.avgVariation = validVariations.length > 0 
      ? validVariations.reduce((sum: number, p: PriceItem) => sum + (p.variation || 0), 0) / validVariations.length
      : 0;
    group.count = validPrices.length;
  });

  return (
    <div className="bg-background/80 border-2 border-white/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Resumo de Cotações
        </h2>
        <Link 
          href="/cotacoes" 
          className="text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          Ver detalhes →
        </Link>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.values(commodityGroups).map((group: any) => (
          <Link 
            key={group.commodity}
            href={`/cotacoes/${group.commodity}`}
            className="block bg-black/20 rounded-lg p-4 hover:bg-black/30 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-lg overflow-hidden">
                <Image
                  src={COMMODITY_IMAGES[group.commodity] || "/images/default-commodity.jpg"}
                  alt={COMMODITY_NAMES[group.commodity]}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-green-400 transition-colors">
                  {COMMODITY_NAMES[group.commodity] || group.commodity}
                </h3>
                <p className="text-xs text-white/60">{group.count} cotações</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-white">
                  R$ {formatPrice(group.avgPrice)}
                </p>
                <p className="text-xs text-white/60">Preço médio</p>
              </div>
              
              {formatVariation(group.avgVariation) && (
                <div className={`flex items-center gap-1 ${getVariationColor(group.avgVariation)}`}>
                  {getVariationIcon(group.avgVariation)}
                  <span className="text-sm font-medium">
                    {formatVariation(group.avgVariation)}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
      
      {Object.keys(commodityGroups).length === 0 && (
        <div className="text-center py-12">
          <p className="text-white/60">Nenhuma cotação disponível no momento</p>
        </div>
      )}
    </div>
  );
}