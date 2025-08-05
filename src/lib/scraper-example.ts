// src/lib/scraper-example.ts
interface ScrapedData {
  commodity: string;
  state: string;
  city?: string; // cidade é opcional
  price: string;
}

async function sendPricesToAPI(scrapedData: ScrapedData[]) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  
  const payload = {
    prices: scrapedData.map(item => ({
      commodity: item.commodity,
      state: item.state,
      city: item.city, // incluindo cidade quando disponível
      price: item.price,
      date: new Date().toISOString().split('T')[0],
      source: 'nome-do-site-fonte',
    })),
    scraperKey: process.env.SCRAPER_API_KEY,
  };

  try {
    const response = await fetch(`${apiUrl}/api/prices/import`, {
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
    console.error('Erro ao enviar preços:', error);
    throw error;
  }
}

// Exemplo de uso após scraping
async function exemploScraper() {
  const dadosExtraidos: ScrapedData[] = [
    { commodity: 'soja', state: 'SP', city: 'São Paulo', price: '152.50' },
    { commodity: 'soja', state: 'SP', city: 'Campinas', price: '151.80' },
    { commodity: 'soja', state: 'MG', city: 'Belo Horizonte', price: '151.00' },
    { commodity: 'milho', state: 'SP', price: '82.30' }, // sem cidade
    { commodity: 'milho', state: 'PR', city: 'Curitiba', price: '81.50' },
    { commodity: 'arroba-boi', state: 'MS', city: 'Campo Grande', price: '325.00' },
  ];
  
  await sendPricesToAPI(dadosExtraidos);
}