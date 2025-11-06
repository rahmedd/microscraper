import { and, desc, eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { PRICE_COND, prices, products } from './schema'

export const db = drizzle({
	connection: {
		url: process.env.DB_URL!,
	}
})

export async function getLastPrice(url: string, condition: PRICE_COND, sale: boolean) {
	const lastPriceRows = await db
		.select()
		.from(prices)
		.innerJoin(products, eq(prices.productId, products.id))
		.where(
			and(
				eq(products.url, url),
				eq(prices.condition, condition),
				eq(prices.sale, sale),
			)
		)
		.orderBy(desc(prices.createdAt))
		.limit(1)

	return lastPriceRows
}
