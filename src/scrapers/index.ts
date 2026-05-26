import type { ScrapeResult } from '../types/scrape-result'
import { scrapePrice as micro } from './micro'
import { scrapePrice as gasco } from './gasco'

export type ScrapeFn = (url: string) => Promise<ScrapeResult[]>

const scrapers: Record<string, ScrapeFn> = {
	micro,
	gasco,
}

export function getScraper(store: string): ScrapeFn {
	const fn = scrapers[store]
	if (!fn) throw new Error(`Unknown store: ${store}`)
	return fn
}

