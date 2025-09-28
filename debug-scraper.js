const cheerio = require('cheerio');

async function testScraper() {
  try {
    console.log('🔍 Testando scraper...');
    
    // Simular HTML de uma tabela da ScotConsultoria
    const mockHTML = `
    <div class="conteudo_centro">
      <table>
        <thead>
          <tr><th>Data: 25/09/2023</th></tr>
        </thead>
        <tbody>
          <tr><td>Estado</td><td>Cidade</td><td>Preço</td></tr>
          <tr><td>SP</td><td>Campinas</td><td>122,50</td></tr>
          <tr><td>MS</td><td>Campo Grande</td><td>118,30</td></tr>
          <tr><td></td><td>Dourados</td><td>119,50</td></tr>
          <tr><td>MG</td><td>Uberlândia</td><td>120,00</td></tr>
          <tr><td></td><td>Uberaba</td><td>121,50</td></tr>
        </tbody>
      </table>
    </div>`;
    
    const $ = cheerio.load(mockHTML);
    const rows = $('tbody tr');
    
    console.log(`Total de linhas: ${rows.length}`);
    
    let currentState = '';
    
    rows.each((idx, row) => {
      if (idx > 0) { // Pular cabeçalho
        const cols = $(row).children();
        const stateCol = $(cols[0]).text().trim();
        const cityCol = $(cols[1]).text().trim();
        const priceCol = $(cols[2]).text().trim();
        
        console.log(`\nLinha ${idx}:`);
        console.log(`  Estado: "${stateCol}"`);
        console.log(`  Cidade: "${cityCol}"`);
        console.log(`  Preço: "${priceCol}"`);
        
        // Lógica do scraper atual
        let state = stateCol;
        let city = cityCol;
        
        if (!state && !city) {
          console.log('  ❌ Pulando - nem estado nem cidade');
          return;
        }
        
        if (!state && currentState) {
          state = currentState;
          console.log(`  🔄 Usando estado anterior: ${state}`);
        } else if (state) {
          currentState = state;
          console.log(`  ✅ Novo estado: ${state}`);
        }
        
        if (!city) city = "N/A";
        
        if (!priceCol) {
          console.log('  ❌ Pulando - sem preço');
          return;
        }
        
        console.log(`  🎯 RESULTADO: ${state} - ${city} - R$ ${priceCol}`);
        
        // Aqui identificamos um possível problema: se não há estado e não há estado anterior
        if (!state) {
          console.log('  ⚠️  PROBLEMA: Estado perdido!');
        }
      }
    });
    
  } catch (error) {
    console.error('Erro:', error);
  }
}

testScraper();