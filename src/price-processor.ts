import { Price, Product } from './schema'
import type { ScrapeResult } from './types/scrape-result'

export function shouldUpdate(last: Price | null, result: ScrapeResult, product: Product): boolean {
	const scrapeSucessful = result.status === 'SUCCESS'
	const priceIsValid = result.extractedPrice > 0
	const priceIsAboveThreshold = result.extractedPrice >= product.threshold
	const priceHasChanged = (!last || last.price !== result.extractedPrice || last.sale !== result.sale)

	const ret = scrapeSucessful && priceIsValid && priceIsAboveThreshold && priceHasChanged

	console.log({
		scrapeSucessful,
		priceIsValid,
		priceIsAboveThreshold,
		priceHasChanged,
		ret,
	})

	return ret
}
