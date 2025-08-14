import * as cheerio from "cheerio";
import iconv from "iconv-lite";
import { stringToNumber, convertStringToDate } from "./utils";

interface NoticiasData {
  commodity: string;
  state: string;
  city: string;
  price: number;
  date: string | null;
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

function cleanLocationText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim();
}

function parseVariation(variationText: string): number {
  if (!variationText || variationText === '-' || variationText === '') return 0;
  
  try {
    const cleanVariation = variationText
      .replace(/[%\s,]/g, '')
      .replace(',', '.')
      .replace('+', '');
    
    const percentage = parseFloat(cleanVariation);
    return isNaN(percentage) ? 0 : Math.round(percentage * 100);
  } catch {
    return 0;
  }
}

function extractPriceFromText(priceText: string): number | null {
  try {
    const cleanPrice = priceText
      .replace(/R\$\s*/gi, '')
      .replace(/\s+/g, '')
      .trim();
    
    if (!cleanPrice || cleanPrice === 's/ cotação' || cleanPrice === '-') {
      return null;
    }
    
    return stringToNumber(cleanPrice);
  } catch {
    return null;
  }
}

// Função melhorada que detecta automaticamente qualquer padrão de estado brasileiro
function extractLocationFromText(locationText: string): { state: string; city: string } | null {
  const cleanLocation = cleanLocationText(locationText);
  
  // Lista de todos os estados brasileiros (códigos e nomes)
  const brazilianStates = [
    { code: 'AC', names: ['Acre', 'AC'] },
    { code: 'AL', names: ['Alagoas', 'AL'] },
    { code: 'AP', names: ['Amapá', 'Amapa', 'AP'] },
    { code: 'AM', names: ['Amazonas', 'AM'] },
    { code: 'BA', names: ['Bahia', 'BA'] },
    { code: 'CE', names: ['Ceará', 'Ceara', 'CE'] },
    { code: 'DF', names: ['Distrito Federal', 'DF', 'Brasília', 'Brasilia'] },
    { code: 'ES', names: ['Espírito Santo', 'Espirito Santo', 'ES'] },
    { code: 'GO', names: ['Goiás', 'Goias', 'GO'] },
    { code: 'MA', names: ['Maranhão', 'Maranhao', 'MA'] },
    { code: 'MT', names: ['Mato Grosso', 'MT'] },
    { code: 'MS', names: ['Mato Grosso do Sul', 'MS'] },
    { code: 'MG', names: ['Minas Gerais', 'MG'] },
    { code: 'PA', names: ['Pará', 'Para', 'PA'] },
    { code: 'PB', names: ['Paraíba', 'Paraiba', 'PB'] },
    { code: 'PR', names: ['Paraná', 'Parana', 'PR'] },
    { code: 'PE', names: ['Pernambuco', 'PE'] },
    { code: 'PI', names: ['Piauí', 'Piaui', 'PI'] },
    { code: 'RJ', names: ['Rio de Janeiro', 'RJ'] },
    { code: 'RN', names: ['Rio Grande do Norte', 'RN'] },
    { code: 'RS', names: ['Rio Grande do Sul', 'RS'] },
    { code: 'RO', names: ['Rondônia', 'Rondonia', 'RO'] },
    { code: 'RR', names: ['Roraima', 'RR'] },
    { code: 'SC', names: ['Santa Catarina', 'SC'] },
    { code: 'SP', names: ['São Paulo', 'Sao Paulo', 'SP'] },
    { code: 'SE', names: ['Sergipe', 'SE'] },
    { code: 'TO', names: ['Tocantins', 'TO'] }
  ];
  
  // Padrão 1: "Cidade/UF" (ex: "São Paulo/SP", "Campo Grande/MS")
  const cityStateSlash = cleanLocation.match(/^(.+)\/([A-Z]{2})$/);
  if (cityStateSlash) {
    const city = cityStateSlash[1].trim();
    const stateCode = cityStateSlash[2];
    
    // Verificar se é um código de estado válido
    const validState = brazilianStates.find(s => s.code === stateCode);
    if (validState) {
      return { state: stateCode, city: city || 'Capital' };
    }
  }
  
  // Padrão 2: "Cidade (UF)" (ex: "São Paulo (SP)")
  const cityStateParens = cleanLocation.match(/^(.+)\s*\(([A-Z]{2})\)$/);
  if (cityStateParens) {
    const city = cityStateParens[1].trim();
    const stateCode = cityStateParens[2];
    
    const validState = brazilianStates.find(s => s.code === stateCode);
    if (validState) {
      return { state: stateCode, city: city || 'Capital' };
    }
  }
  
  // Padrão 3: Apenas código do estado "UF"
  const stateOnly = cleanLocation.match(/^([A-Z]{2})$/);
  if (stateOnly) {
    const stateCode = stateOnly[1];
    const validState = brazilianStates.find(s => s.code === stateCode);
    if (validState) {
      return { state: stateCode, city: 'Capital' };
    }
  }
  
  // Padrão 4: "Cidade - Estado" ou "Cidade, Estado"
  const cityDashState = cleanLocation.match(/^(.+?)[\s\-,]+(.+)$/);
  if (cityDashState) {
    const cityPart = cityDashState[1].trim();
    const statePart = cityDashState[2].trim();
    
    // Procurar o estado na segunda parte
    for (const state of brazilianStates) {
      for (const stateName of state.names) {
        if (statePart.toLowerCase().includes(stateName.toLowerCase())) {
          return { state: state.code, city: cityPart };
        }
      }
    }
  }
  
  // Padrão 5: Procurar por qualquer menção de estado no texto
  for (const state of brazilianStates) {
    for (const stateName of state.names) {
      const regex = new RegExp(stateName, 'i');
      if (regex.test(cleanLocation)) {
        // Extrair cidade removendo o nome do estado
        let city = cleanLocation
          .replace(regex, '')
          .replace(/[\/\-,\(\)]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        
        return { 
          state: state.code, 
          city: city || 'Capital' 
        };
      }
    }
  }
  
  // Padrão 6: Casos especiais (Portos, etc.)
  const specialCases = [
    { pattern: /porto\s+paranaguá/i, state: 'PR', city: 'Porto Paranaguá' },
    { pattern: /porto\s+santos/i, state: 'SP', city: 'Porto Santos' },
    { pattern: /porto\s+rio\s+grande/i, state: 'RS', city: 'Porto Rio Grande' },
    { pattern: /oeste\s+da?\s+bahia/i, state: 'BA', city: 'Oeste da Bahia' },
    { pattern: /luis\s+eduardo\s+magalh[ãa]es/i, state: 'BA', city: 'Luís Eduardo Magalhães' },
  ];
  
  for (const special of specialCases) {
    if (special.pattern.test(cleanLocation)) {
      return { state: special.state, city: special.city };
    }
  }
  
  // Se não conseguiu identificar, retornar null
  console.warn(`⚠️ Localização não identificada: "${cleanLocation}"`);
  return null;
}

function extractDateFromTable(tableHTML: string): string | null {
  // Procurar por "Fechamento: DD/MM/YYYY"
  const dateMatch = tableHTML.match(/Fechamento:\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
  if (dateMatch) {
    return convertStringToDate(dateMatch[1]);
  }
  return null;
}

function isHeaderRow(text: string): boolean {
  const headerKeywords = [
    'praça', 'preço', 'variação', 'fechamento', 'fonte',
    'r$/sc', 'kg', 'cotação', 'mercado', 'data'
  ];
  
  const lowerText = text.toLowerCase();
  return headerKeywords.some(keyword => lowerText.includes(keyword));
}

export function parseNoticiasTableAuto($: cheerio.CheerioAPI): NoticiasData[] {
  const data: NoticiasData[] = [];
  let currentDate: string | null = null;
  
  // Buscar por todas as tabelas na página
  $('table').each((tableIndex, table) => {
    const tableText = $(table).text();
    
    // Extrair data da tabela
    const tableDate = extractDateFromTable(tableText);
    if (tableDate) {
      currentDate = tableDate;
      console.log(`📅 Data encontrada na tabela ${tableIndex}: ${tableDate}`);
    }
    
    // Se não encontrou data, usar data atual
    if (!currentDate) {
      currentDate = new Date().toISOString().split('T')[0];
      console.log(`⚠️ Usando data atual: ${currentDate}`);
    }
    
    let rowCount = 0;
    let validRows = 0;
    
    // Processar todas as linhas da tabela
    $(table).find('tr').each((rowIndex, row) => {
      const cells = $(row).find('td, th');
      
      if (cells.length < 2) return; // Pular linhas sem dados suficientes
      
      rowCount++;
      
      try {
        const locationText = cleanLocationText($(cells[0]).text());
        const priceText = cleanLocationText($(cells[1]).text());
        const variationText = cells.length > 2 ? cleanLocationText($(cells[2]).text()) : '';
        
        // Pular linhas de cabeçalho
        if (isHeaderRow(locationText + ' ' + priceText)) {
          return;
        }
        
        // Pular linhas vazias
        if (!locationText || !priceText) {
          return;
        }
        
        // Extrair localização automaticamente
        const location = extractLocationFromText(locationText);
        if (!location) {
          return; // Já logou warning na função
        }
        
        // Extrair preço
        const price = extractPriceFromText(priceText);
        if (!price || price <= 0) {
          console.log(`ℹ️ Sem cotação: ${location.city}/${location.state} (${priceText})`);
          return;
        }
        
        // Validar faixa de preço (soja entre R$ 30,00 e R$ 400,00)
        const priceInReais = price / 100;
        if (priceInReais < 30 || priceInReais > 400) {
          console.warn(`⚠️ Preço suspeito: ${location.city}/${location.state} - R$ ${priceInReais.toFixed(2)}`);
          return;
        }
        
        // Extrair variação
        const variation = parseVariation(variationText);
        
        const record: NoticiasData = {
          commodity: 'soja',
          state: location.state,
          city: location.city,
          price,
          date: currentDate,
          variation,
          source: 'noticias_agricolas'
        };
        
        data.push(record);
        validRows++;
        
        console.log(`✅ ${location.state}/${location.city}: R$ ${priceInReais.toFixed(2)} (${variation > 0 ? '+' : ''}${(variation/100).toFixed(2)}%)`);
        
      } catch (error) {
        console.warn(`❌ Erro ao processar linha ${rowIndex}: ${$(cells[0]).text()}`, error);
      }
    });
    
    console.log(`📊 Tabela ${tableIndex}: ${validRows} cotações válidas de ${rowCount} linhas`);
  });
  
  return data;
}

// Função principal que descobre automaticamente todas as cotações
export async function scrapeNoticiasAgricolasAuto(): Promise<NoticiasData[]> {
  console.log('🔍 Iniciando scraping automático do Notícias Agrícolas...');
  
  // URLs principais para tentar
  const mainUrls = [
    'https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico-sindicatos-e-cooperativas',
    'https://www.noticiasagricolas.com.br/cotacoes/soja',
    'https://www.noticiasagricolas.com.br/cotacoes/soja/soja-mercado-fisico',
  ];

  const allData: NoticiasData[] = [];
  
  for (const url of mainUrls) {
    try {
      console.log(`🌐 Analisando: ${url}`);
      
      const body = await loadNoticiasUrl(url);
      const $ = cheerio.load(body);
      
      // Extrair dados automaticamente de todas as tabelas
      const data = parseNoticiasTableAuto($);
      
      if (data.length > 0) {
        allData.push(...data);
        console.log(`✅ ${url}: ${data.length} cotações encontradas`);
        
        // Se encontrou dados na primeira URL, não precisa tentar as outras
        break;
      } else {
        console.log(`ℹ️ ${url}: Nenhuma cotação encontrada`);
      }
      
      // Delay entre requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Erro ao fazer scrape de ${url}:`, error);
    }
  }
  
  // Remover duplicatas baseado em estado+cidade+data
  const uniqueData = allData.filter((item, index, array) => {
    const key = `${item.state}-${item.city}-${item.date}`;
    return array.findIndex(other => `${other.state}-${other.city}-${other.date}` === key) === index;
  });
  
  // Estatísticas por estado
  const byState = uniqueData.reduce((acc, item) => {
    acc[item.state] = (acc[item.state] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  console.log('📍 Estados detectados automaticamente:', Object.keys(byState).sort());
  console.log('📊 Cotações por estado:', byState);
  console.log(`🎯 Total: ${allData.length} cotações brutas → ${uniqueData.length} únicas`);
  
  return uniqueData;
}