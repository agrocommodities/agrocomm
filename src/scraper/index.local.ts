import { scrapeBoi, scrapeVaca, scrapeMilho, scrapeSoja } from './scot'

function getRandomNumber(max: number, min: number): number {
  // return ((Math.floor(Math.random() * (max - min + 1)) + min) * 1000) * 60 // mins
  return ((Math.floor(Math.random() * (max - min + 1)) + min) * 1000) // secs
}

async function scrape() {
  const min = 10, max = 20
  let delay = getRandomNumber(min, max)
  
  await Bun.sleep(delay)
  await scrapeBoi()
    .then(() => console.log('🐂 Scrape Boi Gordo completo.'))
    .catch(e => { console.log(e) })

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeVaca()
    .then(_ => { console.log('🐄 Scrape Vaca Gorda completo.') })
    .catch(e => { console.log(e) })

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeMilho()
    .then(_ => { console.log('🌽 Scrape Milho completo.') })
    .catch(e => { console.log(e) })  

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeSoja()
    .then(_ => console.log('🌱 Scrape Soja completo.'))
    .catch(e => { console.log(e) })
}

scrape()
  .finally(() => { 
    console.log("🕸️ Scrape completo.")
    process.exit(0)
  })