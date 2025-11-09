import { Price, Product } from './schema'
import type { ScrapeResult } from './types/scrape-result'

export function shouldUpdate(last: Price, result: ScrapeResult, product: Product): boolean {
	if (
		(result.status === 'SUCCESS') &&
		(result.extractedPrice > 0) &&
	 	(result.extractedPrice >= product.threshold) &&
		(!last || last.price !== result.extractedPrice || last.sale !== result.sale)
	) {
		return true
	}

	return false
}
