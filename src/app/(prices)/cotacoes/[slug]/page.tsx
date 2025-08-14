// src/app/(prices)/cotacoes/[slug]/page.tsx (atualizar)
import Link from "next/link";
import { db } from "@/db";
import { prices } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { QuotationClient } from "@/components/prices";
import { checkUserSubscription } from "@/lib/subscription";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; date?: string }>;
}

export default async function CommodityPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, date } = await searchParams;

  // Verificar assinatura do usuário
  const { isSubscribed } = await checkUserSubscription();

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
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
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

  // Verificar se está tentando acessar dados históricos
  const mostRecentDate = availableDates[0].date;
  const requestedDate = date || mostRecentDate;
  const isHistoricalData = requestedDate !== mostRecentDate;

  // Se não é assinante e está tentando acessar dados históricos, redirecionar
  if (isHistoricalData && !isSubscribed) {
    // Redirecionar para a data mais recente
    const params = new URLSearchParams();
    if (state && state !== "all") {
      params.set("state", state);
    }
    const redirectUrl = `/cotacoes/${slug}${params.toString() ? `?${params.toString()}` : ''}`;
    redirect(redirectUrl);
  }

  // Filtrar datas disponíveis para não assinantes (apenas a mais recente)
  const filteredDates = isSubscribed ? availableDates : [availableDates[0]];
  
  const selectedDate = date || mostRecentDate;
  const isValidDate = filteredDates.some(d => d.date === selectedDate);
  const finalDate = isValidDate ? selectedDate : mostRecentDate;
  
  try {
    const conditions = [eq(prices.commodity, slug), eq(prices.date, finalDate)];
    if (state && state !== "all") conditions.push(eq(prices.state, state));

    const priceList = await db
      .select({
        id: prices.id,
        price: prices.price,
        date: prices.date,
        variation: prices.variation,
        stateCode: prices.state,
        stateName: prices.state,
        cityName: prices.city,
      })
      .from(prices)
      .where(and(...conditions))
      .orderBy(prices.state, prices.city);

    const statesWithPrices = await db
      .select({ state: prices.state })
      .from(prices)
      .where(eq(prices.commodity, slug))
      .groupBy(prices.state);

    const availableStates = stateList.filter(state => 
      statesWithPrices.some(sp => sp.state === state.code)
    );

    const priceListWithStateNames = priceList.map(price => ({ ...price, stateName: price.stateCode }));

    const average = priceListWithStateNames.length > 0
      ? (priceListWithStateNames.reduce((sum, q) => sum + q.price, 0) / priceListWithStateNames.length / 100).toFixed(2)
      : "0.00";

    return (
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
          {!isSubscribed && (
            <div className="mt-4 p-4 bg-blue-500/20 border border-blue-500/50 rounded-lg">
              <p className="text-blue-300 text-sm">
                📊 Você está visualizando apenas as cotações mais recentes. 
                <Link href="/#planos" className="underline font-medium ml-1">
                  Assine um plano
                </Link> para acessar o histórico completo.
              </p>
            </div>
          )}
        </div>

        <QuotationClient
          commodity={slug}
          states={availableStates}
          prices={priceListWithStateNames}
          availableDates={filteredDates.map(d => d.date)}
          selectedDate={finalDate}
          selectedState={state || "all"}
          average={average}
          isSubscribed={isSubscribed}
        />
      </div>
    );
  } catch (error) {
    console.error("Erro ao buscar preços:", error);
    
    return (
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">{slug.toUpperCase()}</h1>
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