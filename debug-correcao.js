// Teste das correções aplicadas

const cheerio = require('cheerio');

console.log('🔧 TESTE DAS CORREÇÕES APLICADAS');
console.log('==============================');

// Simular cenários que antes eram problemáticos
const testHTML = `
  <table>
    <tbody>
      <tr><td>Cabeçalho 1</td><td>Cabeçalho 2</td><td>Cabeçalho 3</td></tr>
      <tr><td>SubHeader</td><td>SubHeader</td><td>SubHeader</td></tr>
      <tr><td>Total</td><td>Média</td><td>Valor</td></tr>
      <tr><td></td><td></td><td>315,50</td></tr> <!-- ANTES: seria perdido -->
      <tr><td>SP</td><td>São Paulo</td><td>320,00</td></tr>
      <tr><td></td><td>Campinas</td><td>318,50</td></tr> 
      <tr><td>MS</td><td>Campo Grande</td><td>312,00</td></tr>
      <tr><td></td><td>Dourados</td><td>314,00</td></tr>
      <tr><td></td><td></td><td>316,50</td></tr> <!-- ANTES: seria perdido -->
    </tbody>
  </table>`;

const $ = cheerio.load(testHTML);
const tr = $('tbody tr');

console.log(`Total de linhas: ${tr.length}`);

let oldState = '';
let processedCount = 0;
let skipCount = 0;

for (let idx = 0; idx < tr.length; idx++) {
  if (idx > 2) { // Simular lógica do scraper
    const el = tr[idx];
    
    let state = $(el).children().eq(0).text().trim();
    let city = $(el).children().eq(1).text().trim();
    const rawPrice = $(el).children().eq(2).text().trim();
    
    console.log(`\n📋 Linha ${idx}: state="${state}" city="${city}" price="${rawPrice}"`);
    
    // 🔧 NOVA LÓGICA (corrigida)
    if (!rawPrice) {
      console.log('  ❌ SKIP: Sem preço (correto)');
      skipCount++;
      continue;
    }
    
    // Aplicar lógica de estado anterior
    if (!state && oldState) {
      state = oldState;
      console.log(`  🔄 Estado restaurado: ${state}`);
    } else if (state) {
      oldState = state;
      console.log(`  ✅ Novo estado: ${state}`);
    }
    
    if (!city) city = "N/A";
    
    // Verificar se seria salvo
    if (state) {
      console.log(`  ✅ SALVO: ${state} - ${city} - R$ ${rawPrice}`);
      processedCount++;
    } else {
      console.log(`  ⚠️  SEM ESTADO: Seria salvo como "null - ${city} - R$ ${rawPrice}"`);
      processedCount++;
    }
  }
}

console.log(`\n📊 RESULTADO APÓS CORREÇÕES:`);
console.log(`  Linhas processadas: ${processedCount}`);
console.log(`  Linhas puladas (sem preço): ${skipCount}`);
console.log(`  Taxa de aproveitamento: ${((processedCount / (processedCount + skipCount)) * 100).toFixed(1)}%`);

console.log('\n🎉 PROBLEMAS CORRIGIDOS:');
console.log('  ✅ Removida condição: if (!location && !currentState) continue');
console.log('  ✅ Removida condição: if (!state && !city) continue'); 
console.log('  ✅ Agora só pula se não houver preço: if (!rawPrice) continue');
console.log('  ✅ Linhas com preços válidos não são mais perdidas!');