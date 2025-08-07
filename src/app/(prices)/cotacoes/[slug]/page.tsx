import Link from "next/link";
import { db } from "@/db";
import { states, cities, prices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { QuotationClient } from "@/components/prices";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; date?: string }>;
}

export default async function CommodityPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, date } = await searchParams;
  const stateList = await db.query.states.findMany({ orderBy: (states, { asc }) => [asc(states.name)] });

  // Buscar datas disponíveis para este commodity
  const availableDates = await db
    .select({ date: prices.date })
    .from(prices)
    .where(eq(prices.commodity, slug))
    .groupBy(prices.date)
    .orderBy(desc(prices.date))
    .limit(30); // Limitar a 30 datas mais recentes

  if (availableDates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug}</h1>
          <p className="text-white/70">Unidade: {slug}</p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg border-2 border-yellow-200 dark:border-yellow-800">
          <p className="text-yellow-800 dark:text-yellow-200">
            Ainda não há cotações disponíveis para {slug}.
          </p>
        </div>
        
        <div className="mt-6">
          <Link          
            href="/cotacoes"
            className="inline-flex items-center px-4 py-2 border-2 border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-black/30 hover:bg-black/50 transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  // Usar a data selecionada ou a mais recente disponível
  const selectedDate = date || availableDates[0].date;
  const isValidDate = availableDates.some(d => d.date === selectedDate);
  const finalDate = isValidDate ? selectedDate : availableDates[0].date;
  
  try {
    const conditions = [eq(prices.commodity, slug), eq(prices.date, finalDate)];

    if (state && state !== "all") conditions.push(eq(states.code, state));

    const priceList = await db
      .select({
        id: prices.id,
        price: prices.price,
        date: prices.date,
        variation: prices.variation || 0,
        stateCode: states.code,
        stateName: states.name,
        stateId: states.id,
        cityName: cities.name,
        cityId: cities.id,
      })
      .from(prices)
      .innerJoin(states, eq(prices.state, states.code))
      .leftJoin(cities, eq(prices.city, cities.name))
      .where(and(...conditions))
      .orderBy(states.name, cities.name);

    // Calcular média corretamente (preços em centavos)
    const average = priceList.length > 0
      ? (priceList.reduce((sum, q) => sum + q.price, 0) / priceList.length / 100).toFixed(2)
      : "0.00";

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug}</h1>
          <p className="text-white/70">Unidade: {slug}</p>
        </div>

        <QuotationClient
          commodity={slug}
          states={stateList}
          prices={priceList}
          availableDates={availableDates.map(d => d.date)}
          selectedDate={finalDate}
          selectedState={state || "all"}
          average={average}
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug}</h1>
          <p className="text-white/70">Unidade: {slug}</p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg border-2 border-red-200 dark:border-red-800">
          <p className="text-red-800 dark:text-red-200">
            Erro ao carregar cotações. Por favor, tente novamente.
          </p>
        </div>
        
        <div className="mt-6">
          <Link
            href="/cotacoes"
            className="inline-flex items-center px-4 py-2 border-2 border-white/20 rounded-md shadow-sm text-sm font-medium text-white bg-black/30 hover:bg-black/50 transition-colors"
          >
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }
}