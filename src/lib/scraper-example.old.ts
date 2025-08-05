// src/lib/scraper-example.ts
// Este é um exemplo de como o scraper Cheerio enviaria os dados

interface ScrapedData {
  commodity: string;
  state: string;
  price: string;
}

async function sendQuotationsToAPI(scrapedData: ScrapedData[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const payload = {
    quotations: scrapedData.map(item => ({
      commodity: item.commodity,
      state: item.state,
      price: item.price,
      date: new Date().toISOString().split('T')[0], // data de hoje
      source: 'nome-do-site-fonte',
    })),
    scraperKey: process.env.SCRAPER_API_KEY, // se estiver usando autenticação
  };

  try {
    const response = await fetch(`${apiUrl}/api/quotations/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    console.log('Resultado da importação:', result);
    return result;
  } catch (error) {
    console.error('Erro ao enviar cotações:', error);
    throw error;
  }
}

// Exemplo de uso após scraping com Cheerio
async function exemploScraper2() {
  // Aqui você faria o scraping com Cheerio
  // const $ = cheerio.load(html);
  // ... código do scraping ...
  
  // Dados fictícios para exemplo
  const dadosExtraidos: ScrapedData[] = [
    { commodity: 'soja', state: 'SP', price: '152.50' },
    { commodity: 'soja', state: 'MG', price: '151.00' },
    { commodity: 'milho', state: 'SP', price: '82.30' },
    { commodity: 'milho', state: 'PR', price: '81.50' },
    { commodity: 'arroba-boi', state: 'MS', price: '325.00' },
    { commodity: 'arroba-vaca', state: 'MS', price: '285.00' },
  ];
  
  // Enviar para a API
  await sendQuotationsToAPI(dadosExtraidos);
}