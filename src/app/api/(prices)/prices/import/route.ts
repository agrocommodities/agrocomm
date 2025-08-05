// src/app/api/prices/import/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { commodities, states, cities, prices } from "@/db/schema";
import { eq, and } from "drizzle-orm";

type Price = typeof prices.$inferInsert;

interface ImportRequest {
  prices: Price[];
  scraperKey?: string; // chave opcional para autenticação
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();
    
    // Validação básica de segurança (opcional)
    const scraperKey = process.env.SCRAPER_API_KEY;
    if (scraperKey && body.scraperKey !== scraperKey) {
      return NextResponse.json(
        { error: "Chave de API inválida" },
        { status: 401 }
      );
    }

    if (!body.prices || !Array.isArray(body.prices)) {
      return NextResponse.json(
        { error: "Formato inválido: esperado array de preços" },
        { status: 400 }
      );
    }

    const results = {
      inserted: 0,
      duplicates: 0,
      errors: [] as string[],
    };

    // Processar cada preço
    for (const priceData of body.prices) {
      try {
        // Buscar commodity
        // const commodity = await db.query.commodities.findFirst({
        //   where: eq(commodities.slug, priceData.commodity.toLowerCase().replace(/\s+/g, '-')),
        // });

        const commodity = await db
          .select()
          .from(commodities)
          .where(eq(commodities.slug, priceData.commodity.toLowerCase().replace(/\s+/g, '-')))
          .limit(1);

        if (!commodity[0]) {
          results.errors.push(`Commodity não encontrada: ${priceData.commodity}`);
          continue;
        }

        if (!commodity) {
          results.errors.push(`Commodity não encontrada: ${priceData.commodity}`);
          continue;
        }

        // Buscar ou criar estado
        let state = await db.query.states.findFirst({
          where: eq(states.code, priceData.state.toUpperCase()),
        });

        if (!state) {
          const [newState] = await db.insert(states).values({
            code: priceData.state.toUpperCase(),
            name: getStateName(priceData.state.toUpperCase()),
          }).returning();
          state = newState;
        }

        // Buscar ou criar cidade (se fornecida)
        let cityId = null;
        if (priceData.city) {
          let city = await db.query.cities.findFirst({
            where: and(
              eq(cities.name, priceData.city),
              eq(cities.stateId, state.id)
            ),
          });

          if (!city) {
            const [newCity] = await db.insert(cities).values({
              name: priceData.city,
              stateId: state.id,
            }).returning();
            city = newCity;
          }
          
          cityId = city.id;
        }

        // Preparar dados do preço
        const priceDate = priceData.date || new Date().toISOString().split('T')[0];
        const price = typeof priceData.price === 'string' 
          ? priceData.price.replace(',', '.').replace(/[^\d.]/g, '')
          : priceData.price.toString();

        // Tentar inserir (o índice único vai prevenir duplicatas)
        try {
          await db.insert(prices).values({
            commodityId: commodity.id,
            stateId: state.id,
            cityId: cityId,
            price: price,
            date: priceDate,
            source: priceData.source,
          });
          results.inserted++;
        } catch (error: any) {
          if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            results.duplicates++;
          } else {
            throw error;
          }
        }
      } catch (error) {
        results.errors.push(`Erro ao processar preço: ${JSON.stringify(priceData)}`);
      }
    }

    return NextResponse.json({
      success: true,
      results,
      message: `Importados ${results.inserted} preços. ${results.duplicates} duplicatas ignoradas.`,
    });
  } catch (error) {
    console.error("Erro na importação:", error);
    return NextResponse.json(
      { error: "Erro ao processar importação" },
      { status: 500 }
    );
  }
}

// Função auxiliar para obter nome completo do estado
function getStateName(code: string): string {
  const stateNames: Record<string, string> = {
    'AC': 'Acre',
    'AL': 'Alagoas',
    'AP': 'Amapá',
    'AM': 'Amazonas',
    'BA': 'Bahia',
    'CE': 'Ceará',
    'DF': 'Distrito Federal',
    'ES': 'Espírito Santo',
    'GO': 'Goiás',
    'MA': 'Maranhão',
    'MT': 'Mato Grosso',
    'MS': 'Mato Grosso do Sul',
    'MG': 'Minas Gerais',
    'PA': 'Pará',
    'PB': 'Paraíba',
    'PR': 'Paraná',
    'PE': 'Pernambuco',
    'PI': 'Piauí',
    'RJ': 'Rio de Janeiro',
    'RN': 'Rio Grande do Norte',
    'RS': 'Rio Grande do Sul',
    'RO': 'Rondônia',
    'RR': 'Roraima',
    'SC': 'Santa Catarina',
    'SP': 'São Paulo',
    'SE': 'Sergipe',
    'TO': 'Tocantins',
  };
  
  return stateNames[code] || code;
}