import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ContentSidebar() {
  return (
    <aside className="w-80 space-y-6">
      {/* Bloco de Cotações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cotações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm">Soja - SP</span>
            <span className="font-semibold text-green-600">R$ 120,50</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Milho - MT</span>
            <span className="font-semibold text-red-600">R$ 85,20</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Boi Gordo - MS</span>
            <span className="font-semibold text-green-600">R$ 280,00</span>
          </div>
        </CardContent>
      </Card>

      {/* Bloco de Notícias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Notícias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-b border-b-black/50 pb-3 last:border-b-0 last:pb-0">
            <h4 className="text-sm font-medium mb-1">
              Safra de soja bate recorde
            </h4>
            <p className="text-xs text-foreground/60">
              Produção estimada em 160 milhões de toneladas...
            </p>
          </div>
          {/* <div className="border-b !border-b-red-500 pb-3 last:border-b-0 last:pb-0"> */}
          <div className="border-b-2 border-b-black/50 pb-3 last:border-b-0 last:pb-0">
            <h4 className="text-sm font-medium mb-1">
              Preços do milho em alta
            </h4>
            <p className="text-xs text-foreground/60">
              Aumento da demanda internacional impacta...
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Bloco de Análises */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Análises do Mercado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p className="text-foreground/80">
              📈 Tendência de alta para commodities agrícolas
            </p>
            <p className="text-foreground/80">
              🌧️ Chuvas favorecem plantio no Centro-Oeste
            </p>
            <p className="text-foreground/80">
              💰 Dólar impacta exportações de grãos
            </p>
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}