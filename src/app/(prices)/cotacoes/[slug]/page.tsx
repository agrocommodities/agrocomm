import Link from "next/link";
import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { QuotationClient } from "@/components/prices";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; date?: string }>;
}

export default async function CommodityPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, date } = await searchParams;
  
  //console.log('Page params:', { slug, state, date }); // Debug

  const stateList = await db.query.states.findMany({ orderBy: (states, { asc }) => [asc(states.name)] });

  // Buscar datas disponíveis para este commodity
  const availableDates = await db
    .select({ date: prices.date })
    .from(prices)
    .where(eq(prices.commodity, slug))
    .groupBy(prices.date)
    .orderBy(desc(prices.date))
    .limit(30);

  if (availableDates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
          {/* <p className="text-white/70">Commodity: {slug}</p> */}
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
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
    if (state && state !== "all") conditions.push(eq(prices.state, state));

    // Query simplificada - estado e cidade já são strings
    const priceList = await db
      .select({
        id: prices.id,
        price: prices.price,
        date: prices.date,
        variation: prices.variation,
        stateCode: prices.state, // Diretamente do campo state
        stateName: prices.state, // Será mapeado posteriormente
        cityName: prices.city, // Diretamente do campo city
      })
      .from(prices)
      .where(and(...conditions))
      .orderBy(prices.state, prices.city);

    // console.log('Prices from DB:', priceList.length); // Debug

    // Mapear códigos de estado para nomes completos
    const priceListWithStateNames = priceList.map(price => ({ ...price, stateName: price.stateCode }));

    // Calcular média corretamente (preços em centavos)
    const average = priceListWithStateNames.length > 0
      ? (priceListWithStateNames.reduce((sum, q) => sum + q.price, 0) / priceListWithStateNames.length / 100).toFixed(2)
      : "0.00";

    console.log('Final data to component:', {
      commodity: slug,
      selectedState: state || "all",
      selectedDate: finalDate,
      statesCount: stateList.length,
      pricesCount: priceListWithStateNames.length,
    }); // Debug

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
          {/* <p className="text-white/70">Commodity: {slug}</p> */}
        </div>

        <QuotationClient
          commodity={slug}
          states={stateList}
          prices={priceListWithStateNames}
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
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
          {/* <p className="text-white/70">Commodity: {slug}</p> */}
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
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar
          </Link>
        </div>
      </div>
    );
  }
}