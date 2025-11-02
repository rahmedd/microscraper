import { db } from '../db/db'
import { prices } from '../db/schema'
import { eq } from 'drizzle-orm'
import type { Hono } from 'hono'

export const apiRoutes = (honoApp: Hono) => {
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
}
