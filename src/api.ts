import 'dotenv/config'
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { db } from './db'
import { prices, flags, products } from './schema'
import { eq } from 'drizzle-orm'
import { checkEnvVars } from './utils'
import { vValidator } from '@hono/valibot-validator'
import {
	idParamSchema,
	updateFlagSchema,
	createProductSchema,
	updateProductSchema,
} from './validation'

checkEnvVars()

export const honoApp = new Hono().basePath('/api')

honoApp.get('/', (c) => {
	return c.text('Hello Hono!')
})

// Flags CRUD
honoApp.get('/flags', async (c) => {
	const allFlags = await db.select().from(flags)
	return c.json(allFlags)
})

honoApp.get(
	'/flags/:id',
	vValidator('param', idParamSchema),
	async (c) => {
		const { id } = c.req.valid('param')
		const numericId = parseInt(id, 10)
		const flag = await db.select().from(flags).where(eq(flags.id, numericId))
		return c.json(flag)
	},
)

// honoApp.post('/flags', async (c) => {
// 	const { name, enabled } = await c.req.json()
// 	const newFlag = await db.insert(flags).values({ name, enabled }).returning()
// 	return c.json(newFlag)
// })

honoApp.put(
	'/flags/:id',
	vValidator('param', idParamSchema),
	vValidator('json', updateFlagSchema),
	async (c) => {
		const { id } = c.req.valid('param')
		const { enabled } = c.req.valid('json')
		const numericId = parseInt(id, 10)
		const updatedFlag = await db.update(flags).set({ enabled }).where(eq(flags.id, numericId)).returning()
		return c.json(updatedFlag)
	},
)

// honoApp.delete('/flags/:id', async (c) => {
// 	const id = c.req.param('id')
// 	const deletedFlag = await db.delete(flags).where(eq(flags.id, Number(id))).returning()
// 	return c.json(deletedFlag)
// })


// Products CRUD
honoApp.get('/products', async (c) => {
	const allProducts = await db.select().from(products)
	return c.json(allProducts)
})

honoApp.get('/products/:id', vValidator('param', idParamSchema), async (c) => {
	const { id } = c.req.valid('param')
	const product = await db.select().from(products).where(eq(products.id, Number(id)))
	return c.json(product)
})

honoApp.post('/products', vValidator('json', createProductSchema), async (c) => {
	const { url, threshold, enabled } = c.req.valid('json')
	const newProduct = await db.insert(products).values({ url, threshold, enabled }).returning()
	return c.json(newProduct)
})

honoApp.put('/products/:id', vValidator('param', idParamSchema), vValidator('json', updateProductSchema), async (c) => {
	const { id } = c.req.valid('param')
	const { url, threshold, enabled } = c.req.valid('json')
	const updatedProduct = await db.update(products).set({ url, threshold, enabled }).where(eq(products.id, Number(id))).returning()
	return c.json(updatedProduct)
})

honoApp.delete('/products/:id', vValidator('param', idParamSchema), async (c) => {
	const { id } = c.req.valid('param')
	const deletedProduct = await db.delete(products).where(eq(products.id, Number(id))).returning()
	return c.json(deletedProduct)
})

// Prices CRUD
honoApp.get('/prices', async (c) => {
	const allPrices = await db.select().from(prices)
	return c.json(allPrices)
})

honoApp.get('/prices/:id', vValidator('param', idParamSchema), async (c) => {
	const { id } = c.req.valid('param')
	const price = await db.select().from(prices).where(eq(prices.id, Number(id)))
	return c.json(price)
})

honoApp.get('/products/:id/prices', vValidator('param', idParamSchema), async (c) => {
	const { id } = c.req.valid('param')

	const productPriceChanges = await db.select()
		.from(prices)
		.where(
			eq(prices.productId, Number(id))
		)

	return c.json(productPriceChanges)
})

// honoApp.post('/prices', async (c) => {
// 	const { productId, price, sale, condition } = await c.req.json()
// 	const newPrice = await db.insert(prices).values({ productId, price, sale, condition }).returning()
// 	return c.json(newPrice)
// })

// honoApp.put('/prices/:id', async (c) => {
// 	const id = c.req.param('id')
// 	const { productId, price, sale, condition } = await c.req.json()
// 	const updatedPrice = await db.update(prices).set({ productId, price, sale, condition }).where(eq(prices.id, Number(id))).returning()
// 	return c.json(updatedPrice)
// })

// honoApp.delete('/prices/:id', async (c) => {
// 	const id = c.req.param('id')
// 	const deletedPrice = await db.delete(prices).where(eq(prices.id, Number(id))).returning()
// 	return c.json(deletedPrice)
// })

const server = serve({
	fetch: honoApp.fetch,
	port: Number(process.env.API_PORT!)
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`)
})

const shutdown = () => {
	console.log('API server shutting down...')
	server.close(() => {
		console.log('API server closed.')
		process.exit(0)
	})
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)