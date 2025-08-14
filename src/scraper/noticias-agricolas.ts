// src/scraper/noticias-agricolas.ts
import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { extractCityAndState, stringToNumber, convertStringToDate } from "./utils";

interface NoticiasData {
  commodity: string;
  state: string;
  city: string;
  price: number;
  date: string;
  variation: number;
  source: string;
}

export async function loadNoticiasUrl(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8'
    }
  });
  
  const contentType = response.headers.get('content-type');
  const buffer = await response.arrayBuffer();
  
  if (contentType?.includes('iso-8859-1')) {
    return iconv.decode(Buffer.from(buffer), "iso-8859-1");
  }
  
  return new TextDecoder('utf-8').decode(buffer);
}

export function extractDateFromContent(content: string): string | null {
  // Procurar por padrões de data como "Fechamento: DD/MM/YYYY" ou "Data: DD/MM/YYYY"
  const datePatterns = [
    /Fechamento:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /Data:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i,
    /(\d{1,2}\/\d{1,2}\/\d{4})/g
  ];

  for (const pattern of datePatterns) {
    const match = content.match(pattern);
    if (match) {
      const dateStr = match[1] || match[0];
      return convertStringToDate(dateStr);
    }
  }

  return null;
}

export function parseNoticiasTable($: cheerio.CheerioAPI, tableDate: string): NoticiasData[] {
  const data: NoticiasData[] = [];
  
  $('table').each((_, table) => {
    $(table).find('tbody tr, tr').each((idx, row) => {
      if (idx === 0) return; // Pular cabeçalho
      
      try {
        const cells = $(row).find('td');
        if (cells.length < 2) return;

        const locationText = $(cells[0]).text().trim();
        const priceText = $(cells[1]).text().trim();
        const variationText = cells.length > 2 ? $(cells[2]).text().trim() : '';

        if (!locationText || !priceText) return;

        // Extrair cidade e estado
        const { state, city } = extractCityAndState(locationText);
        if (!state || !city) return;

        // Converter preço
        const price = stringToNumber(priceText);
        if (!price || price <= 0) return;

        // Converter variação (opcional)
        let variation = 0;
        if (variationText) {
          try {
            variation = parseFloat(variationText.replace(/[%\s,]/g, '').replace(',', '.')) * 100; // Converter para pontos base
          } catch {
            variation = 0;
          }
        }

        data.push({
          commodity: 'soja', // Por enquanto só soja
          state,
          city,
          price,
          date: tableDate,
          variation,
          source: 'noticias_agricolas'
        });

        console.log(`Notícias Agrícolas: ${state} - ${city} - R$ ${(price/100).toFixed(2)}`);

      } catch (error) {
        console.warn(`Erro ao processar linha da tabela Notícias Agrícolas:`, error);
      }
    });
  });

  return data;
}

export async function scrapeNoticiasAgricolas(): Promise<NoticiasData[]> {
  const urls = {
    soja_ms: 'https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-ms',
    soja_mt: 'https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-mt',
    soja_go: 'https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-go',
    // Adicionar mais URLs conforme necessário
  };

  const allData: NoticiasData[] = [];

  for (const [key, url] of Object.entries(urls)) {
    try {
      console.log(`🌐 Fazendo scrape: ${url}`);
      
      const body = await loadNoticiasUrl(url);
      const $ = cheerio.load(body);
      
      // Extrair data do conteúdo
      const tableDate = extractDateFromContent(body);
      if (!tableDate) {
        console.warn(`❌ Não foi possível extrair data de ${url}`);
        continue;
      }

      console.log(`📅 Data encontrada: ${tableDate}`);

      // Extrair dados da tabela
      const data = parseNoticiasTable($, tableDate);
      allData.push(...data);

    } catch (error) {
      console.error(`❌ Erro ao fazer scrape de ${url}:`, error);
    }
  }

  return allData;
}