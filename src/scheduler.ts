import { scrapePrice, type ScrapeResult } from './scraper'
import * as cron from 'node-cron'
import 'dotenv/config'
import { app } from './slack'

export const startScheduler = () => {
	const isDevMode = process.env.NODE_ENV === 'dev'
	const CRON_SCHEDULE = isDevMode ? '* * * * *' : '0 12 * * *' // Every minute in dev, daily at 12 PM in production

	console.error('Starting Daily Playwright Scheduler using node-cron pattern...')

	// Schedule the scrapePrice function to run daily
	cron.schedule(CRON_SCHEDULE, async () => {
		console.error(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

		// Split the string by commas, trim whitespace, and filter out any empty strings
		const urlsToScrape: { url: string, threshold: number }[] = JSON.parse(process.env.CS_URL!)
		const thresholdMap: { [key: string]: number } = {}
		urlsToScrape.forEach(e => thresholdMap[e.url] = e.threshold)

		const allResults: ScrapeResult[] = []
		for (const url of urlsToScrape) {
			const result: ScrapeResult[] = await scrapePrice(url.url)
			allResults.push(...result) // Add the result from this scrape to our collection
		}

		for (const result of allResults) {
			if (
				result.status === 'SUCCESS' &&
				result.extractedPrice >= 0 &&
				result.extractedPrice < thresholdMap[result.productUrl]
			) {
				await app.client.chat.postMessage({
					channel: process.env.SLACK_CHANNEL_ID!,
					text: `Price drop alert! is now $${result.extractedPrice}, which is below your threshold of $${thresholdMap[result.productUrl]}. \n\n ${result.productUrl}`,
				})
			}
		}

		console.log(JSON.stringify(allResults))
		console.error(`--- Job Finished ---`)
	})

	console.error(`Scraping task is configured to run daily at (cron: ${CRON_SCHEDULE}).`)
}
