import 'dotenv/config'
import crypto from 'crypto'
import { logger, traceStorage } from './logger'
import path from 'path'
import { Worker } from 'worker_threads'
import * as cron from 'node-cron'
import { db, getAllLastPrices, insertPrice, updateProductName } from './db'
import { flags, products, conditions, PRICE_COND } from './schema'
import { eq } from 'drizzle-orm'
import { postSlackMessage } from './slack-client'
import { checkEnvVars } from './utils'
import { ScrapeResult } from './types/scrape-result'
import { shouldUpdate } from './price-processor'

checkEnvVars()

const isDevMode = process.env.NODE_ENV === 'dev'
const CRON_SCHEDULE = isDevMode ? '* * * * *' : '0 12 * * *' // Every minute in dev, daily at 12 PM in production

logger.info('Starting Daily Playwright Scheduler using node-cron pattern...')

// Schedule the scrapePrice function to run daily
const task = cron.schedule(CRON_SCHEDULE, async () => {
	const traceId = crypto.randomUUID()
	await traceStorage.run(traceId, async () => {
		logger.info(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

		const schedulerEnabled = await db.select().from(flags).where(eq(flags.name, 'SCHEDULER'))
		if (!schedulerEnabled[0]?.enabled) {
			logger.info('scheduler disabled or flag not found, skipping scraper')
			return
		}

		const workerPath = __filename.endsWith('.ts')
			? path.join(__dirname, 'worker.ts')
			: path.join(__dirname, 'worker.js')

		const urlsToScrape = await db.select().from(products).where(eq(products.enabled, true))
		const scrapingJobs = urlsToScrape.map(product => {
			const workerTraceId = crypto.randomUUID()
			return new Promise<ScrapeResult[]>((resolve, reject) => {
				const worker = new Worker(workerPath, {
					workerData: { url: product.url, traceId: workerTraceId, store: product.store },
					...(workerPath.endsWith('.ts') && { execArgv: ['--require', 'tsx/cjs'] }),
				})
				worker.on('message', resolve)
				worker.on('error', reject)
				worker.on('exit', (code) => {
					if (code !== 0)
						reject(new Error(`Worker stopped with exit code ${code}`))
				})
			})
		})

		const settledResults = await Promise.allSettled(scrapingJobs)
		const allResults: ScrapeResult[] = []
		for (const result of settledResults) {
			if (result.status === 'fulfilled') {
				allResults.push(...result.value)
			} else {
				logger.error('Worker failed:', result.reason)
			}
		}

		for (const result of allResults) {
			logger.info(result, 'Scrape result')
			const p = urlsToScrape.find(p => p.url === result.productUrl)

			if (!p) {
				logger.error('error mapping internal url')
				continue
			}

			if (result.productName && !p.name) {
				logger.info(`Updating product name for ${p.url} to: ${result.productName}`)
				await updateProductName(p.id, result.productName)
				p.name = result.productName
			}

			const allLastPrices = await getAllLastPrices(p.url)

			for (const { condition, price } of result.prices) {
				if (price <= 0) {
					logger.warn(`Invalid price ${price} for condition ${condition}, skipping...`)
					continue
				}

				const lastCond = allLastPrices.find(lp => lp.price.condition === condition && lp.price.sale === result.sale)?.price || null
				const updateCond = shouldUpdate(lastCond, price, result, p)

				if (updateCond) {
					logger.info(`updating ${condition} price...`)
					const itemName = p.name || result.productName || p.url
					const message = `*Price Drop Alert!*\n*Item:* <${p.url}|${itemName}>\n*Condition:* ${condition}\n*Previous Price:* $${lastCond ? lastCond.price : 'N/A'}\n*New Price:* $${price}\n*Threshold:* $${p.threshold}`
					await postSlackMessage(
						process.env.SLACK_CHANNEL_ID!,
						message
					)
					await insertPrice(p.id, result.sale, price, condition)
				}
			}

			if (result.status === 'SUCCESS') {
				const latestPerCondition = new Map<string, any>()
				for (const lp of allLastPrices) {
					const existing = latestPerCondition.get(lp.price.condition)
					if (!existing || new Date(lp.price.createdAt).getTime() > new Date(existing.price.createdAt).getTime()) {
						latestPerCondition.set(lp.price.condition, lp)
					}
				}

				for (const lp of latestPerCondition.values()) {
					const lastKnownPrice = lp.price
					if (lastKnownPrice.price > 0) {
						const currentlyInStock = result.prices.some(pr => pr.condition === lastKnownPrice.condition)
						if (!currentlyInStock) {
							logger.info(`${lastKnownPrice.condition} is no longer available for ${p.url}`)
							const itemName = p.name || result.productName || p.url
							const message = `*Out of Stock Alert!*\n*Item:* <${p.url}|${itemName}>\n*Condition:* ${lastKnownPrice.condition}\n*Was:* $${lastKnownPrice.price}`
							await postSlackMessage(
								process.env.SLACK_CHANNEL_ID!,
								message
							)
							await insertPrice(p.id, lastKnownPrice.sale, 0, lastKnownPrice.condition)
						}
					}
				}
			}
		}

		logger.info(`--- Job Finished ---`)
	})
})

logger.info(`Scraping task is configured to run daily at (cron: ${CRON_SCHEDULE}).`)

const keepAlive = setInterval(() => {
	// This empty function keeps the Node.js event loop alive.
	// The cron job will continue to fire based on its internal timing.
}, 1000 * 60 * 60) // Check every hour

const shutdown = () => {
	logger.info('Scheduler shutting down...')
	task.stop()
	clearInterval(keepAlive)
	process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
