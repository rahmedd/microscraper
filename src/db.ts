import { and, desc, eq, sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { PRICE_COND, prices, products, Price, flags, Product, conditions } from './schema'

export const db = drizzle({
	connection: {
		url: process.env.DB_URL!,
	},
	schema: {
		flags,
		products,
		prices,
	},
})

export async function getProduct(url: string): Promise<Product | null> {
	const result: Product[] = await db
		.select({
			id: products.id,
			name: products.name,
			url: products.url,
			store: products.store,
			threshold: products.threshold,
			enabled: products.enabled,
			createdAt: products.createdAt,
			updatedAt: products.updatedAt,
		})
		.from(products)
		.where(eq(products.url, url))
		.limit(1)

	if (result.length > 0 && result[0]) {
		return result[0]
	}
	return null
}

export async function getLastPrice(url: string, condition: PRICE_COND, sale: boolean) {
	const lastPriceRows: Price[] = await db
		.select({
			id: prices.id,
			productId: prices.productId,
			price: prices.price,
			sale: prices.sale,
			condition: prices.condition,
			createdAt: prices.createdAt,
		})
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

	if (lastPriceRows.length > 0 && lastPriceRows[0]) {
		return lastPriceRows[0]
	}

	return null
}

export async function getProductAndLastPrice(url: string, condition: PRICE_COND, sale: boolean) {
	const lastPriceRows = await db
		.select()
		.from(products)
		.innerJoin(prices, eq(products.id, prices.id))
		.where(
			and(
				eq(products.url, url),
				eq(prices.condition, condition),
				eq(prices.sale, sale),
			)
		)
		.orderBy(desc(prices.createdAt))
		.limit(1)

	if (lastPriceRows.length > 0 && lastPriceRows[0]) {
		return lastPriceRows[0]
	}

	return null
}

export async function insertPrice(productId: number, sale: boolean, price: number, condition: PRICE_COND) {
	await db.insert(prices).values({
		productId: productId,
		sale: sale,
		price: price,
		condition: condition,
	})
}

export async function updateProductName(id: number, name: string) {
	await db.update(products)
		.set({ name })
		.where(eq(products.id, id))
}

export async function getAllLastPrices(url: string) {
	return db
		.select({
			price: prices,
			_: sql`MAX(${prices.createdAt})`,
		})
		.from(prices)
		.innerJoin(products, eq(prices.productId, products.id))
		.where(eq(products.url, url))
		.groupBy(prices.condition, prices.sale)
}