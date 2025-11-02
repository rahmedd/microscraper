import { chromium, type Browser, type Page } from 'playwright'
import { db } from './db'
import { prices, products } from './schema'
import { desc, eq } from 'drizzle-orm'

// The specific selector requested by the user
const PRICE_SELECTOR = '#pricing'

// Define a type for the structured result
export type ScrapeResult = {
	product: typeof products.$inferSelect
	productUrl: string
	priceSelector: string
	extractedPrice: number
	priceFormatted: string | null
	status: 'SUCCESS' | 'FAILURE_MISSING_CONTENT' | 'FAILURE_EXCEPTION'
	errorMessage?: string
}

/**
 * Launches a Playwright browser, navigates to the product page,
 * waits for the specific pricing element, and extracts its 'content' attribute.
 *
 * NOTE: This function is now exported for use by a separate scheduler file.
 */
async function scrapePrice(product: typeof products.$inferSelect): Promise<ScrapeResult[]> {
	// Use console.error for all status/debugging messages to keep stdout clean for JSON.
	console.error('Starting Playwright to scrape...')

	// Launch Chromium in headless mode, but use arguments to bypass common bot detection
	const browser: Browser = await chromium.launch({
		headless: true, // Switched back to true, with anti-detection arguments below
		args: [
			// Adds common arguments to mimic a real browser and avoid detection
			'--no-sandbox',
			'--disable-setuid-sandbox',
			// Disables the most common Playwright detection (navigator.webdriver)
			'--disable-blink-features=AutomationControlled',
		],
	})

	const context = await browser.newContext({
		viewport: { width: 1280, height: 720 },
		userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
	})

	const page: Page = await context.newPage()

	// Initialize the array that will hold the final structured result for n8n
	const finalResult: ScrapeResult[] = []

	try {
		// 1. Navigate to the target URL
		console.error(`Navigating to ${product.url}`)
		await page.goto(product.url, { timeout: 10000 })

		// 2. Wait for the specific element to be present in the DOM.
		console.error(`Waiting for element: ${PRICE_SELECTOR}`)
		await page.waitForSelector(PRICE_SELECTOR, { state: 'attached', timeout: 10000 })

		// 3. Use page.locator() and getAttribute() to replicate the desired operation.
		const priceLocator = page.locator(PRICE_SELECTOR)
		const priceContent = await priceLocator.getAttribute('content')

		// 4. Structure the output as an array of objects for n8n compatibility
		if (priceContent) {
			const lastPriceResult = await db.select()
				.from(prices)
				.where(
					eq(prices.productId, product.id)
				)
				.orderBy(
					desc(prices.createdAt)
				)
				.limit(1)

			const lastPrice = lastPriceResult[0].price
			const latestPrice = Number(priceContent)

			if (lastPrice !== Number(priceContent)) {
				await db.insert(prices).values({
					productId: product.id,
					price: latestPrice,
					condition: 'NEW',
				})
			}

			finalResult.push({
				product,
				productUrl: product.url,
				priceSelector: PRICE_SELECTOR,
				extractedPrice: Number(priceContent),
				priceFormatted: `$${priceContent}`,
				status: 'SUCCESS',
			})
			console.error('\nExtraction successful. JSON output prepared.')
		}
		else {
			finalResult.push({
				product,
				productUrl: product.url,
				priceSelector: PRICE_SELECTOR,
				extractedPrice: -1,
				priceFormatted: null,
				status: 'FAILURE_MISSING_CONTENT',
			})
			console.error(`Element ${PRICE_SELECTOR} found, but 'content' attribute was empty or null.`)
		}

	}
	catch (e: unknown) {
		// General error handling for navigation or selection failures
		const error = e as Error
		console.error('\nAn error occurred during scraping:', error.message)
		console.error('The selector might not exist or the page structure may have changed.')

		// Log a failure result even on exception
		finalResult.push({
			product,
			productUrl: product.url,
			priceSelector: PRICE_SELECTOR,
			extractedPrice: -1,
			priceFormatted: null,
			status: 'FAILURE_EXCEPTION',
			errorMessage: error.message,
		})

	}
	finally {
		// Ensure the browser is closed
		await browser.close()
		console.error('\nPlaywright browser closed.')
	}
	return finalResult
}

// Export the function for the scheduler to use
export { scrapePrice }