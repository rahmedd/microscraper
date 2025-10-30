// Import the scraping logic from the file
import { scrapePrice, type ScrapeResult } from './scraper.js'
import * as cron from 'node-cron'
import * as dotenv from 'dotenv'
dotenv.config()

// Define the daily schedule using cron syntax:
// '0 1 * * *' means: At minute 0, hour 1 (1:00 AM), every day of the month, every month, every day of the week.
const DAILY_CRON_SCHEDULE = '* * * * *'

console.error('Starting Daily Playwright Scheduler using node-cron pattern...')

// Schedule the scrapePrice function to run daily
cron.schedule(DAILY_CRON_SCHEDULE, async () => {
	console.error(`\n--- Running Daily Scrape Job at ${new Date().toLocaleTimeString()} ---`)

	// The comma-separated list of URLs to scrape, loaded from environment variables
	const productUrlsString = process.env.CS_URL

	if (!productUrlsString) {
		console.error('Error: CS_URL environment variable is not set or is empty.')
		return // Exit the job if no URLs are provided
	}

	// Split the string by commas, trim whitespace, and filter out any empty strings
	const urlsToScrape = productUrlsString.split(',').map(url => url.trim()).filter(url => url)
	const allResults: ScrapeResult[] = []

	for (const url of urlsToScrape) {
		const result: ScrapeResult[] = await scrapePrice(url)
		allResults.push(...result) // Add the result from this scrape to our collection
	}
	console.log(JSON.stringify(allResults))
	console.error(`--- Job Finished ---`)
})

console.error(`Scraping task is configured to run daily at 1:00 AM (cron: ${DAILY_CRON_SCHEDULE}).`)

// To prevent the Node.js process from exiting after the initial task completes, 
// we must ensure the event loop stays active. A real node-cron instance handles this,
// but for demonstration or in simplified environments, a dummy interval works.
console.error('The process is now running indefinitely to maintain the cron job queue.')
setInterval(() => {
	// This empty function keeps the Node.js event loop alive.
	// The cron job will continue to fire based on its internal timing.
}, 1000 * 60 * 60) // Check every hour
