import { sql, desc, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { news, prices } from "@/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatarReais, formatCommodityName } from "@/lib/prices";
import { PriceVariationAnimated } from '@/components/ui/price-variation-animated';

async function PricesShorts() {
  const recentDates = await db
    .select({ date: sql<string>`DATE(${prices.createdAt})` })
    .from(prices)
    .groupBy(sql`DATE(${prices.createdAt})`)
    .orderBy(desc(sql`DATE(${prices.createdAt})`))
    .limit(1); 

  const randomNewsByRecentDate = await Promise.all(
    recentDates.map(async (date) => {
      return db
        .select()
        .from(prices)
        .where(sql`DATE(${prices.createdAt}) = ${date.date}`)
        .orderBy(sql`RANDOM()`)
        .limit(5);
    })
  );

  // 3. Achata o array de arrays em um único array
  const flattenedPrices = randomNewsByRecentDate.flat();

  return (
    <div>
      {flattenedPrices.map(item => (
        <div key={item.id} className="flex justify-between items-center">
          <div>
            <span className="text-sm mr-2">{item.state.toUpperCase()}</span>
            <span className="text-xs">{formatCommodityName(item.commodity)}</span>
          </div>          
          <span className="text-green-600"><PriceVariationAnimated variation={item.variation || 0} /></span>
          <span className={`${!item.variation || item.variation < 1 ? 'text-green-600' : 'text-red-600'}`}>R$ {formatarReais(item.price)}</span>
        </div>
      ))}
    </div>
  )
}

async function NewsShorts() {
  const shorts = await db.select().from(news).orderBy(desc(news.publishedAt)).limit(5);

  return (
    <div className="border-b border-b-black/50 pb-3 last:border-b-0 last:pb-0">
      {shorts.map(item => (
        <div key={item.id} className="mb-3 border-b border-b-black/50 last:border-b-0 last:mb-0 pb-3">
          <h4 className="text-sm font-medium mb-1">
            {item.title}
          </h4>
          <span className="w-full text-right text-xs text-gray-500 mt-1 block">{item.source}</span>
        </div>
      ))}
      {/* <p className="text-xs text-foreground/60">
        Produção estimada em 160 milhões de toneladas...
      </p> */}
    </div>
  );
}

export default function ContentSidebar() {
  return (
    <aside className="w-80 space-y-6">
      {/* Bloco de Cotações Recentes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cotações Recentes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <PricesShorts />
        </CardContent>
      </Card>

      {/* Bloco de Notícias */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Últimas Notícias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <NewsShorts />
        </CardContent>
      </Card>

      {/* Bloco de Análises */}
      {/* <Card>
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
      </Card> */}
    </aside>
  );
}