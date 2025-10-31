import { scrapePrice, type ScrapeResult } from './scraper'
import * as cron from 'node-cron'
import 'dotenv/config'
import { slackApp } from './slack'
import { db } from './db'
import { products } from './schema'

export const startScheduler = () => {
	const isDevMode = process.env.NODE_ENV === 'dev'
	const CRON_SCHEDULE = isDevMode ? '* * * * *' : '0 12 * * *' // Every minute in dev, daily at 12 PM in production

	console.error('Starting Daily Playwright Scheduler using node-cron pattern...')

	// Schedule the scrapePrice function to run daily
	cron.schedule(CRON_SCHEDULE, async () => {
		console.error(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

		const urlsToScrape = await db.select().from(products)

		const allResults: ScrapeResult[] = []
		for (const url of urlsToScrape) {
			const result: ScrapeResult[] = await scrapePrice(url)
			allResults.push(...result) // Add the result from this scrape to our collection
		}

		for (const result of allResults) {
			if (
				result.status === 'SUCCESS' &&
				result.extractedPrice >= 0 &&
				result.extractedPrice < result.product.threshold
			) {
				await slackApp.client.chat.postMessage({
					channel: process.env.SLACK_CHANNEL_ID!,
					text: `Price drop alert! is now $${result.extractedPrice}, which is below your threshold of $${result.product.threshold}. \n\n ${result.productUrl}`,
				})
			}
		}

		console.log(JSON.stringify(allResults))
		console.error(`--- Job Finished ---`)
	})

	console.error(`Scraping task is configured to run daily at (cron: ${CRON_SCHEDULE}).`)
}
