import * as cheerio from "cheerio";
import { loadScotUrl } from "./scot";
import { stringToNumber, extractCityAndState } from "./utils";

// URLs da Scot
const urls = {
  graos: 'https://www.scotconsultoria.com.br/cotacoes/graos/?ref=smnb',
  soja: 'https://www.scotconsultoria.com.br/cotacoes/soja/?ref=smnb', // Tente essa URL também
};

async function debugScrapeSoja() {
  console.log("🔍 INICIANDO DEBUG DO SCRAPER DE SOJA");
  console.log("=====================================");

  try {
    // 1. Fazer download da página
    console.log("📥 Fazendo download da página...");
    const body = await loadScotUrl(urls.graos);
    
    // Salvar o HTML para análise (opcional)
    await Bun.write("debug-scot-page.html", body);
    console.log("💾 HTML salvo em debug-scot-page.html");

    // 2. Analisar a página com Cheerio
    const $ = cheerio.load(body);
    
    // 3. Verificar diferentes seletores possíveis
    console.log("\n🔍 TESTANDO DIFERENTES SELETORES:");
    
    const selectors = [
      'div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr',
      'div.conteudo_centro table tbody tr',
      'table tbody tr',
      '.cotacoes tbody tr',
      'div.conteudo_centro > table tbody tr'
    ];

    for (const selector of selectors) {
      const rows = $(selector);
      console.log(`${selector}: ${rows.length} linhas encontradas`);
      
      if (rows.length > 0) {
        console.log("📊 Primeiras 3 linhas:");
        rows.slice(0, 3).each((idx, el) => {
          const rowText = $(el).text().replace(/\s+/g, ' ').trim();
          console.log(`  Linha ${idx}: ${rowText}`);
        });
      }
    }

    // 4. Usar o seletor original e analisar dados
    console.log("\n🎯 ANALISANDO DADOS COM SELETOR ORIGINAL:");
    const tr = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) tbody tr');
    
    if (tr.length === 0) {
      console.log("❌ Nenhuma linha encontrada com o seletor original!");
      
      // Tentar seletores alternativos
      const alternativeSelectors = [
        'table:contains("Soja") tbody tr',
        'table tbody tr:contains("MS")',
        'tbody tr'
      ];
      
      for (const altSelector of alternativeSelectors) {
        const altRows = $(altSelector);
        if (altRows.length > 0) {
          console.log(`✅ Encontrado com seletor alternativo: ${altSelector} (${altRows.length} linhas)`);
          break;
        }
      }
    } else {
      console.log(`📊 Encontradas ${tr.length} linhas`);
      
      // Analisar cabeçalho da tabela
      const tableDate = $('div.conteudo_centro:nth-child(4) > table:nth-child(5) > thead:nth-child(1) > tr:nth-child(1) > th:nth-child(1)')
        .text()
        .replace(/(\s+)/g, ' ');
      
      console.log(`📅 Data da tabela: "${tableDate}"`);

      // Analisar cada linha
      console.log("\n📋 ANÁLISE LINHA POR LINHA:");
      tr.each((idx, el) => {
        const cols = $(el).children();
        console.log(`\nLinha ${idx}:`);
        console.log(`  Colunas: ${cols.length}`);
        
        cols.each((colIdx, colEl) => {
          const colText = $(colEl).text().replace(/\s+/g, ' ').trim();
          console.log(`    Col ${colIdx}: "${colText}"`);
        });

        // Se parece com dados de preço (pular cabeçalhos)
        if (idx > 2 && cols.length >= 3) {
          const location = $(cols[0]).text().replace(/(\s+)/g, ' ').trim();
          const rawPrice = $(cols[2]).text().replace(/(\s+)/g, ' ').trim(); // Assumindo coluna 2 para preço
          
          console.log(`  🏷️  Localização: "${location}"`);
          console.log(`  💰 Preço bruto: "${rawPrice}"`);
          
          if (location && rawPrice) {
            const { state, city } = extractCityAndState(location);
            console.log(`    🗺️  Estado: "${state}", Cidade: "${city}"`);
            
            // Testar conversão do preço
            if (rawPrice.match(/\d+[,.]?\d*/)) {
              const price = stringToNumber(rawPrice);
              console.log(`    🔢 Preço convertido: ${price} centavos = R$ ${(price/100).toFixed(2)}`);
              
              // Verificar se é Campo Grande/MS especificamente
              if (location.includes("Campo Grande") && location.includes("MS")) {
                console.log(`    🎯 CAMPO GRANDE/MS ENCONTRADO!`);
                console.log(`    📊 Preço original na web: R$ 122,50`);
                console.log(`    📊 Preço scrapeado: R$ ${(price/100).toFixed(2)}`);
                console.log(`    ❓ Diferença: ${((price/100) - 122.50).toFixed(2)}`);
              }
            }
          }
        }
      });
    }

    // 5. Verificar se há outras tabelas na página
    console.log("\n🔍 VERIFICANDO OUTRAS TABELAS:");
    const allTables = $('table');
    console.log(`Total de tabelas encontradas: ${allTables.length}`);
    
    allTables.each((idx, table) => {
      const tableText = $(table).text().replace(/\s+/g, ' ').substring(0, 100);
      console.log(`Tabela ${idx}: ${tableText}...`);
    });

  } catch (error) {
    console.error("❌ Erro no debug:", error);
  }
}

// Função para testar conversão de preços isoladamente
function testPriceConversion() {
  console.log("\n🧪 TESTE DE CONVERSÃO DE PREÇOS:");
  console.log("==================================");
  
  const testCases = [
    "122,50",
    "122.50", 
    "122,5",
    "122",
    " 122,50 ",
    "R$ 122,50",
    "122,50 R$",
    "301,50", // Valor atual incorreto
  ];
  
  testCases.forEach(testCase => {
    try {
      const converted = stringToNumber(testCase);
      const backToReal = converted / 100;
      console.log(`"${testCase}" -> ${converted} centavos -> R$ ${backToReal.toFixed(2)}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`"${testCase}" -> ERRO: ${errorMessage}`);
    }
  });
}

// Executar os testes
async function main() {
  await debugScrapeSoja();
  testPriceConversion();
  
  console.log("\n✅ Debug completo! Verifique o arquivo debug-scot-page.html para análise manual.");
}

main().catch(console.error);