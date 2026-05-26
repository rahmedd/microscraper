import { Price, Product } from './schema'
import type { ScrapeResult } from './types/scrape-result'
import { logger } from './logger'

export function shouldUpdate(last: Price | null, currentPrice: number, result: ScrapeResult, product: Product): boolean {
	const scrapeSucessful = result.status === 'SUCCESS'
	const priceIsValid = currentPrice > 0
	const priceIsAboveThreshold = currentPrice >= product.threshold
	const priceHasChanged = (!last || last.price !== currentPrice || last.sale !== result.sale)

	const ret = scrapeSucessful && priceIsValid && priceIsAboveThreshold && priceHasChanged

	logger.info({
		scrapeSucessful,
		priceIsValid,
		priceIsAboveThreshold,
		priceHasChanged,
		ret,
	})

	return ret
}
