import { Price, Product } from './schema'
import type { ScrapeResult } from './types/scrape-result'

export function shouldUpdate(last: Price, result: ScrapeResult, product: Product): boolean {
	if (result.status === 'SUCCESS' && result.extractedPrice < product.threshold) {
		// const lastPriceRows = await db
		// 	.select()
		// 	.from(prices)
		// 	.innerJoin(products, eq(prices.productId, products.id))
		// 	.where(eq(products.url, product.url))
		// 	.orderBy(desc(prices.createdAt))
		// 	.limit(1)

		// const lastPriceRecord = lastPriceRows[0]

		// If there's no last price record, or if the price has changed, insert a new record
		if (
			result.extractedPrice > 0 &&
			(!last ||
				last.price !== result.extractedPrice ||
				last.sale !== result.sale)
		) {
			return true
			// await db.insert(prices).values({
			// 	productId: product.id,
			// 	sale: result.sale,
			// 	price: extractedPrice,
			// 	condition: 'NEW',
			// })
		}
	}

	return false
}
