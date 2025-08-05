import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { commodities, states, cities, prices } from "@/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { QuotationClient } from "@/components/prices";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ state?: string; date?: string }>;
}

export default async function CommodityPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { state, date } = await searchParams;

  const commodity = await db.query.commodities.findFirst({ where: eq(commodities.slug, slug) });
  if (!commodity) notFound();

  const stateList = await db.query.states.findMany({ orderBy: (states, { asc }) => [asc(states.name)] });

  // Buscar datas disponíveis para este commodity
  const availableDates = await db
    .select({ date: prices.date })
    .from(prices)
    .where(eq(prices.commodityId, commodity.id))
    .groupBy(prices.date)
    .orderBy(desc(prices.date));

  console.log("Datas disponíveis:", availableDates);

  // Se não houver cotações para este commodity
  if (availableDates.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{commodity.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unidade: {commodity.unit}
          </p>
        </div>
        
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
          <p className="text-yellow-800 dark:text-yellow-200">
            Ainda não há cotações disponíveis para {commodity.name}.
          </p>
        </div>
        
        <div className="mt-6">
          <Link          
            href="/cotacoes"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }

  // Usar a data selecionada ou a mais recente disponível
  const selectedDate = date || availableDates[0].date;
  
  // Verificar se a data selecionada existe nas datas disponíveis
  const isValidDate = availableDates.some(d => d.date === selectedDate);
  const finalDate = isValidDate ? selectedDate : availableDates[0].date;
  
  // Construir query para preços
  try {
    // Condições base
    const conditions = [
      eq(prices.commodityId, commodity.id),
      eq(prices.date, finalDate)
    ];

    // Adicionar filtro de estado se necessário
    if (state && state !== "all") {
      conditions.push(eq(states.code, state));
    }

    const priceList = await db
      .select({
        id: prices.id,
        price: prices.price,
        date: prices.date,
        stateCode: states.code,
        stateName: states.name,
        stateId: states.id,
        cityName: cities.name,
        cityId: cities.id,
      })
      .from(prices)
      .innerJoin(states, eq(prices.stateId, states.id))
      .leftJoin(cities, eq(prices.cityId, cities.id))
      .where(and(...conditions))
      .orderBy(states.name, cities.name);

    // Calcular média
    const average = priceList.length > 0
      ? (priceList.reduce((sum, q) => sum + (q.price / 100) / priceList.length, 0).toFixed(2))
      : "0.00";

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{commodity.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unidade: {commodity.unit}
          </p>
        </div>

        <QuotationClient
          commodity={commodity}
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
          <h1 className="text-3xl font-bold">{commodity.name}</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Unidade: {commodity.unit}
          </p>
        </div>
        
        <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-lg">
          <p className="text-red-800 dark:text-red-200">
            Erro ao carregar cotações. Por favor, tente novamente.
          </p>
        </div>
        
        <div className="mt-6">
          <Link
            href="/cotacoes"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            ← Voltar
          </Link>
        </div>
      </div>
    );
  }
}