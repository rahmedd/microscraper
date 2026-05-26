import 'dotenv/config'
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

console.log('Starting Daily Playwright Scheduler using node-cron pattern...')

// Schedule the scrapePrice function to run daily
const task = cron.schedule(CRON_SCHEDULE, async () => {
	console.log(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

	const schedulerEnabled = await db.select().from(flags).where(eq(flags.name, 'SCHEDULER'))
	if (!schedulerEnabled[0]?.enabled) {
		console.log('scheduler disabled or flag not found, skipping scraper')
		return
	}

	const workerPath = __filename.endsWith('.ts')
		? path.join(__dirname, 'worker.ts')
		: path.join(__dirname, 'worker.js')

	const urlsToScrape = await db.select().from(products).where(eq(products.enabled, true))
	const scrapingJobs = urlsToScrape.map(product =>
		new Promise<ScrapeResult[]>((resolve, reject) => {
			const worker = new Worker(workerPath, {
				workerData: { url: product.url },
				...(workerPath.endsWith('.ts') && { execArgv: ['--require', 'tsx/cjs'] }),
			})
			worker.on('message', resolve)
			worker.on('error', reject)
			worker.on('exit', (code) => {
				if (code !== 0)
					reject(new Error(`Worker stopped with exit code ${code}`))
			})
		})
	)

	const settledResults = await Promise.allSettled(scrapingJobs)
	const allResults: ScrapeResult[] = []
	for (const result of settledResults) {
		if (result.status === 'fulfilled') {
			allResults.push(...result.value)
		} else {
			console.log('Worker failed:', result.reason)
		}
	}

	for (const result of allResults) {
		const p = urlsToScrape.find(p => p.url === result.productUrl)

		if (!p) {
			console.log('error mapping internal url')
			continue
		}

		if (result.productName && p.name !== result.productName) {
			console.log(`Updating product name for ${p.url} to: ${result.productName}`)
			await updateProductName(p.id, result.productName)
			p.name = result.productName
		}

		const allLastPrices = await getAllLastPrices(p.url)

		for (const { condition, price } of result.prices) {
			if (price <= 0) {
				console.log(`Invalid price ${price} for condition ${condition}, skipping...`)
				continue
			}

			const lastCond = allLastPrices.find(lp => lp.price.condition === condition && lp.price.sale === result.sale)?.price || null
			const updateCond = shouldUpdate(lastCond, price, result, p)

			if (updateCond) {
				console.log(`updating ${condition} price...`)
				const itemName = p.name || result.productName || p.url
				const message = `*Price Drop Alert!*\n*Item:* <${p.url}|${itemName}>\n*Condition:* ${condition}\n*Previous Price:* $${lastCond ? lastCond.price : 'N/A'}\n*New Price:* $${price}\n*Threshold:* $${p.threshold}`
				await postSlackMessage(
					process.env.SLACK_CHANNEL_ID!,
					message
				)
				await insertPrice(p.id, result.sale, price, condition)
			}
		}
	}

	console.log(JSON.stringify(allResults, null, 2))
	console.log(`--- Job Finished ---`)
})

console.log(`Scraping task is configured to run daily at (cron: ${CRON_SCHEDULE}).`)

const keepAlive = setInterval(() => {
	// This empty function keeps the Node.js event loop alive.
	// The cron job will continue to fire based on its internal timing.
}, 1000 * 60 * 60) // Check every hour

const shutdown = () => {
	console.log('Scheduler shutting down...')
	task.stop()
	clearInterval(keepAlive)
	process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)
