// src/components/ui/sidebar.tsx
import { LatestNews } from "@/components/news/latest";
import { LatestPrices } from "@/components/prices/latest";
import { MiniChart } from "@/components/prices/mini-chart";

const COMMODITIES = ['soja', 'milho', 'boi', 'vaca'];

export function Sidebar() {
  return (
    <div className="space-y-4">
      {/* Resumo de Cotações */}
      <LatestPrices />
      
      {/* Mini Gráficos */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-white px-1">Tendências (7 dias)</h3>
        <div className="space-y-3">
          {COMMODITIES.map((commodity) => (
            <MiniChart key={commodity} commodity={commodity} height={80} />
          ))}
        </div>
      </div>
      
      {/* Últimas Notícias */}
      <LatestNews limit={4} />
    </div>
  );
}