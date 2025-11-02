import 'dotenv/config'
import { Worker } from 'worker_threads'
import * as cron from 'node-cron'
import { db } from './db'
import { flags, products } from './schema'
import { eq } from 'drizzle-orm'
import { ScrapeResult } from './scraper'
import { slackApp } from './slack'
import { checkEnvVars } from './utils'
// import App from '@slack/bolt'

checkEnvVars()

// const slackApp = new App({
// 	token: process.env.SLACK_BOT_TOKEN,
// 	socketMode: true,
// 	appToken: process.env.SLACK_APP_TOKEN
// })

const isDevMode = process.env.NODE_ENV === 'dev'
const CRON_SCHEDULE = isDevMode ? '* * * * *' : '0 12 * * *' // Every minute in dev, daily at 12 PM in production

console.error('Starting Daily Playwright Scheduler using node-cron pattern...')

// Schedule the scrapePrice function to run daily
cron.schedule(CRON_SCHEDULE, async () => {
	console.error(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

	const schedulerEnabled = await db.select().from(flags).where(eq(flags.name, 'SCHEDULER'))
	if (!schedulerEnabled[0].enabled) {
		console.log('scheduler disabled, skipping scraper')
		return
	}

	const urlsToScrape = await db.select().from(products)
	const scrapingJobs = urlsToScrape.map(product => 
		new Promise<ScrapeResult[]>((resolve, reject) => {
			const worker = new Worker('./src/worker.ts', {
				workerData: { product },
				execArgv: [...process.execArgv, '--require', 'ts-node/register']
			})
			worker.on('message', resolve)
			worker.on('error', reject)
			worker.on('exit', (code) => {
				if (code !== 0)
					reject(new Error(`Worker stopped with exit code ${code}`))
			})
		})
	)

	const results = await Promise.all(scrapingJobs)
	const allResults = results.flat()

	for (const result of allResults) {
		if (result.status === 'SUCCESS' && result.extractedPrice < result.product.threshold) {
			await slackApp.client.chat.postMessage({
				channel: process.env.SLACK_CHANNEL_ID!,
				text: `Price drop alert! is now $${result.extractedPrice}, which is below your threshold of $${result.product.threshold}. \n\n ${result.productUrl}`,
			})
		}
	}

	console.log(JSON.stringify(allResults, null, 2))
	console.error(`--- Job Finished ---`)
})

console.error(`Scraping task is configured to run daily at (cron: ${CRON_SCHEDULE}).`)

setInterval(() => {
	// This empty function keeps the Node.js event loop alive.
	// The cron job will continue to fire based on its internal timing.
}, 1000 * 60 * 60) // Check every hour