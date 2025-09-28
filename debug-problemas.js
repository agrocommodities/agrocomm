const cheerio = require('cheerio');

// Simular a função extractCityAndState do utils.ts
function extractCityAndState(location) {
  if (!location) return { state: null, city: null };
  
  // Padrão 1: "Cidade/UF" (ex: "São Paulo/SP")
  const cityStateMatch = location.match(/^(.+)\/([A-Z]{2})$/);
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2];
    return { state, city: city || null };
  }
  
  // Padrão 2: Apenas "UF" (ex: "SP")
  const stateOnlyMatch = location.match(/^([A-Z]{2})$/);
  if (stateOnlyMatch) {
    const state = stateOnlyMatch[1];
    return { state, city: null };
  }
  
  return { state: null, city: location };
}

async function testProblematicScenarios() {
  console.log('🔍 Testando cenários problemáticos...');
  
  // Cenário 1: Problema no scraper de BOI (usa extractCityAndState)
  console.log('\n📊 TESTE 1: Scraper de BOI (usa extractCityAndState)');
  const boiHTML = `
    <table>
      <tbody>
        <tr><td>Localização</td><td>Preço</td></tr>
        <tr><td>São Paulo/SP</td><td>320,00</td></tr>
        <tr><td>Campo Grande/MS</td><td>315,50</td></tr>
        <tr><td>Dourados</td><td>318,00</td></tr>
        <tr><td>Cuiabá/MT</td><td>312,00</td></tr>
        <tr><td>Rondonópolis</td><td>313,50</td></tr>
      </tbody>
    </table>`;
  
  const $boi = cheerio.load(boiHTML);
  let currentState = '';
  
  $boi('tbody tr').each((idx, row) => {
    if (idx > 0) {
      const cols = $boi(row).children();
      const location = $boi(cols[0]).text().trim();
      const rawPrice = $boi(cols[1]).text().trim();
      
      console.log(`\nLinha ${idx}: "${location}" - "${rawPrice}"`);
      
      let { state, city } = extractCityAndState(location);
      console.log(`  extractCityAndState: state="${state}", city="${city}"`);
      
      // Lógica do scraper de BOI
      if (!state && currentState) {
        state = currentState;
        city = location || null;
        console.log(`  🔄 Usando estado anterior: ${state}, cidade ajustada: ${city}`);
      } else if (state) {
        currentState = state;
        console.log(`  ✅ Novo estado definido: ${state}`);
      }
      
      if (!rawPrice) {
        console.log(`  ❌ PROBLEMA: Sem preço, pulando`);
        return;
      }
      
      if (rawPrice && state) {
        console.log(`  ✅ SALVO: ${state} - ${city || 'N/A'} - R$ ${rawPrice}`);
      } else {
        console.log(`  ❌ PROBLEMA: Não salvou - state: ${state}, price: ${rawPrice}`);
      }
    }
  });
  
  // Cenário 2: Problema no scraper de SOJA (lógica diferente)
  console.log('\n📊 TESTE 2: Scraper de SOJA (lógica de colunas separadas)');
  const sojaHTML = `
    <table>
      <tbody>
        <tr><td>Estado</td><td>Cidade</td><td>Preço</td></tr>
        <tr><td>SP</td><td>São Paulo</td><td>152,50</td></tr>
        <tr><td></td><td>Campinas</td><td>151,80</td></tr>
        <tr><td>MS</td><td>Campo Grande</td><td>148,30</td></tr>
        <tr><td></td><td>Dourados</td><td>149,50</td></tr>
        <tr><td></td><td></td><td></td></tr>
        <tr><td>MT</td><td>Cuiabá</td><td>150,00</td></tr>
        <tr><td></td><td>Rondonópolis</td><td>151,00</td></tr>
      </tbody>
    </table>`;
  
  const $soja = cheerio.load(sojaHTML);
  let oldState = '';
  
  $soja('tbody tr').each((idx, row) => {
    if (idx > 0) { // Pular cabeçalho (como no código original)
      const cols = $soja(row).children();
      let state = $soja(cols[0]).text().replace(/(\s+)/g, ' ').trim();
      let city = $soja(cols[1]).text().replace(/(\s+)/g, ' ').trim();
      const rawPrice = $soja(cols[2]).text().replace(/(\s+)/g, ' ').trim();
      
      console.log(`\nLinha ${idx}: state="${state}" city="${city}" price="${rawPrice}"`);
      
      // Lógica exata do scraper de SOJA
      if (!state && !city) {
        console.log(`  ❌ PROBLEMA: Pulando - nem estado nem cidade`);
        return; // CONTINUE equivale a return em forEach
      }
      
      if (!state && oldState) {
        state = oldState;
        console.log(`  🔄 Usando estado anterior: ${state}`);
      } else if (state) {
        oldState = state;
        console.log(`  ✅ Novo estado definido: ${state}`);
      }
      
      if (!city) {
        city = "N/A";
        console.log(`  ⚠️  Cidade vazia, definida como N/A`);
      }
      
      if (!rawPrice) {
        console.log(`  ❌ PROBLEMA: Sem preço, pulando`);
        return;
      }
      
      // Lógica da condição final
      if (rawPrice && state) { // No código original: if (price && state)
        console.log(`  ✅ SALVO: ${state} - ${city} - R$ ${rawPrice}`);
      } else {
        console.log(`  ❌ PROBLEMA: Não salvou - state: ${state}, price: ${rawPrice}`);
      }
    }
  });
  
  // Cenário 3: Teste com linha completamente vazia (problema comum)
  console.log('\n📊 TESTE 3: Linhas vazias/problemáticas');
  const emptyHTML = `
    <table>
      <tbody>
        <tr><td>Estado</td><td>Cidade</td><td>Preço</td></tr>
        <tr><td>SP</td><td>São Paulo</td><td>152,50</td></tr>
        <tr><td></td><td></td><td></td></tr>
        <tr><td>MS</td><td>Campo Grande</td><td>148,30</td></tr>
        <tr><td></td><td>Dourados</td><td></td></tr>
        <tr><td></td><td>Três Lagoas</td><td>149,80</td></tr>
      </tbody>
    </table>`;
  
  const $empty = cheerio.load(emptyHTML);
  let testOldState = '';
  
  $empty('tbody tr').each((idx, row) => {
    if (idx > 0) {
      const cols = $empty(row).children();
      let state = $empty(cols[0]).text().trim();
      let city = $empty(cols[1]).text().trim();
      const rawPrice = $empty(cols[2]).text().trim();
      
      console.log(`\nLinha ${idx}: state="${state}" city="${city}" price="${rawPrice}"`);
      
      // Teste da condição que pode estar causando o problema
      if (!state && !city) {
        console.log(`  ❌ SKIP: Condição (!state && !city) = true`);
        return;
      }
      
      if (!state && testOldState) {
        state = testOldState;
        console.log(`  🔄 Estado restaurado: ${state}`);
      } else if (state) {
        testOldState = state;
        console.log(`  ✅ Estado salvo: ${state}`);
      }
      
      if (!city) city = "N/A";
      
      if (!rawPrice) {
        console.log(`  ❌ SKIP: Sem preço`);
        return;
      }
      
      console.log(`  🎯 RESULTADO: ${state} - ${city} - R$ ${rawPrice}`);
    }
  });
}

testProblematicScenarios().catch(console.error);