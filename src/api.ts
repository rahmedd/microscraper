import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { db } from './db'
import { prices } from './schema'
import { eq } from 'drizzle-orm'
import { checkEnvVars } from './utils'

checkEnvVars()

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

honoApp.get('/jobs', (c) => {
	return c.text('Hello Jobs!')
})

serve({
	fetch: honoApp.fetch,
	port: Number(process.env.API_PORT!)
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`)
})