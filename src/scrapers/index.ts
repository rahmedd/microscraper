import { scrapeMicro } from './micro'
import { scrapeGas } from './gas'
import { ScrapeResult } from '../types/scrape-result'

export async function routeScraper(url: string): Promise<ScrapeResult[]> {
	if (url.includes(process.env.MICRO_URL!)) {
		return scrapeMicro(url)
	}
	else if (url.includes(process.env.GAS_URL!)) {
		return scrapeGas(url)
	}
	else {
		console.error(`No scraper found for URL: ${url}`)
		return [{
			productUrl: url,
			extractedPrice: -1,
			status: 'FAILURE_NO_SCRAPER',
			sale: false,
			openboxPrice: -1,
			errorMessage: 'No scraper found for the provided URL.',
		}]
	}
}
