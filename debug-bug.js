// Demonstração do problema específico encontrado no scraper

const cheerio = require('cheerio');

function extractCityAndState(location) {
  if (!location) return { state: null, city: null };
  
  const cityStateMatch = location.match(/^(.+)\/([A-Z]{2})$/);
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2];
    return { state, city: city || null };
  }
  
  const stateOnlyMatch = location.match(/^([A-Z]{2})$/);
  if (stateOnlyMatch) {
    const state = stateOnlyMatch[1];
    return { state, city: null };
  }
  
  return { state: null, city: location };
}

console.log('🐛 DEMONSTRAÇÃO DO BUG ENCONTRADO');
console.log('=================================');

// Simular uma tabela onde as primeiras linhas podem ter localizações vazias
const problematicHTML = `
  <table>
    <tbody>
      <tr><td>Cabeçalho</td><td>Preço</td></tr>
      <tr><td>Região</td><td>Valor</td></tr>
      <tr><td>Total</td><td>Média</td></tr>
      <tr><td></td><td>315,50</td></tr> <!-- LINHA PROBLEMÁTICA: sem localização, mas com preço -->
      <tr><td>São Paulo/SP</td><td>320,00</td></tr>
      <tr><td></td><td>318,50</td></tr> <!-- Esta deveria usar SP como estado -->
      <tr><td>Campo Grande/MS</td><td>312,00</td></tr>
      <tr><td></td><td>314,00</td></tr> <!-- Esta deveria usar MS como estado -->
    </tbody>
  </table>`;

const $ = cheerio.load(problematicHTML);
const tr = $('tbody tr');

console.log(`Total de linhas encontradas: ${tr.length}`);

let currentState = ''; // Estado atual (como no código original)
let skipCount = 0;
let processedCount = 0;

for (let idx = 0; idx < tr.length; idx++) {
  if (idx > 2) { // Como no código original (pula 3 primeiras linhas)
    const el = tr[idx];
    const location = $(el).children().eq(0).text().replace(/(\s+)/g, ' ').trim();
    const rawPrice = $(el).children().eq(1).text().replace(/(\s+)/g, ' ').trim();
    
    console.log(`\n📋 Linha ${idx}: location="${location}" price="${rawPrice}"`);
    
    // 🐛 AQUI ESTÁ O PROBLEMA:
    if (!location && !currentState) {
      console.log('  🐛 BUG: Linha pulada pela condição (!location && !currentState)');
      console.log('  ❌ PERDEU dados da cidade sem estado inicial!');
      skipCount++;
      continue; // Esta linha é perdida!
    }

    let { state, city } = extractCityAndState(location);
    console.log(`  🗺️  extractCityAndState: state="${state}", city="${city}"`);
    
    // Lógica de estado anterior
    if (!state && currentState) {
      state = currentState;
      city = location || null;
      console.log(`  🔄 Usando estado anterior: ${state}, cidade: ${city}`);
    } else if (state) {
      currentState = state;
      console.log(`  ✅ Novo estado definido: ${state}`);
    }

    if (!rawPrice) {
      console.log('  ⚠️  Sem preço, pulando');
      continue;
    }
    
    console.log(`  ✅ PROCESSADO: ${state} - ${city || 'N/A'} - R$ ${rawPrice}`);
    processedCount++;
  }
}

console.log(`\n📊 RESULTADO:`);
console.log(`  Linhas processadas: ${processedCount}`);
console.log(`  Linhas perdidas pelo bug: ${skipCount}`);
console.log(`  Taxa de perda: ${((skipCount / (skipCount + processedCount)) * 100).toFixed(1)}%`);

console.log('\n💡 SOLUÇÃO SUGERIDA:');
console.log('  Alterar a condição de:');
console.log('    if (!location && !currentState) continue');
console.log('  Para:');
console.log('    if (!location && !rawPrice) continue');
console.log('  Ou melhor ainda:');
console.log('    if (!rawPrice) continue // Só pular se não houver preço');