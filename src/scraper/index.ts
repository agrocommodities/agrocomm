import { scrapeBoi, scrapeVaca, scrapeMilho, scrapeSoja } from './scot'

function getRandomNumber(max: number, min: number): number {
  return ((Math.floor(Math.random() * (max - min + 1)) + min) * 1000) // secs
}

async function scrape() {
  const min = 10, max = 60
  let delay = getRandomNumber(min, max)
  
  await Bun.sleep(delay)
  await scrapeBoi()

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeVaca()

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeMilho()

  delay = getRandomNumber(min, max)
  await Bun.sleep(delay)
  await scrapeSoja()
}

scrape().finally(() => process.exit(0))