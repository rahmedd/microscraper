import { Hono } from 'hono'
import { db } from './db'
import { prices } from './schema'
import { eq } from 'drizzle-orm'

export const honoApp = new Hono()

honoApp.get('/', (c) => {
	return c.text('Hello Hono!')
})

honoApp.get('/price-changes', async (c) => {
	const allPriceChanges = await db.select().from(prices)
	return c.json(allPriceChanges)
})

honoApp.get('/price-changes/:productId', async (c) => {
	const productId = c.req.param('productId')

	const productPriceChanges = await db.select()
		.from(prices)
		.where(
			eq(prices.productId, Number(productId))
		)

	return c.json(productPriceChanges)
})
