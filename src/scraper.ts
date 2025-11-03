import { chromium, type Browser, type Page } from 'playwright'

// The specific selector requested by the user
const NEW_PRICE_SELECTOR = '#pricing'
// const OPENBOX_PRICE_SELECTOR = '#opCostNew'
// const SALE_SELECTOR = '.standardDiscount'

// Define a type for the structured result
export type ScrapeResult = {
	productUrl: string
	priceSelector: string
	extractedPrice: number
	openboxPrice: number
	sale: boolean
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
async function scrapePrice(url: string): Promise<ScrapeResult[]> {
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
		console.error(`Navigating to ${url}`)
		await page.goto(url, { timeout: 10000 })

		// 2. Wait for the specific element to be present in the DOM.
		console.error(`Waiting for element: ${NEW_PRICE_SELECTOR}`)
		await page.waitForSelector(NEW_PRICE_SELECTOR, { state: 'attached', timeout: 10000 })

		// 3. Use page.locator() and getAttribute() to replicate the desired operation.
		const priceLocator = page.locator(NEW_PRICE_SELECTOR)
		const priceContent = await priceLocator.getAttribute('content')

		// const openboxPriceLocator = page.locator(OPENBOX_PRICE_SELECTOR)
		// const openboxPriceContent = await openboxPriceLocator.getAttribute('content')

		// const saleLocator = page.locator(SALE_SELECTOR)
		// const isSale = !!await saleLocator.getAttribute('content')

		if (priceContent) {
			finalResult.push({
				productUrl: url,
				priceSelector: NEW_PRICE_SELECTOR,
				extractedPrice: Number(priceContent),
				priceFormatted: `$${priceContent}`,
				status: 'SUCCESS',
				sale: false,
				openboxPrice: -1,
			})
			console.error('\nExtraction successful. JSON output prepared.')
		}
		else {
			finalResult.push({
				productUrl: url,
				priceSelector: NEW_PRICE_SELECTOR,
				extractedPrice: -1,
				priceFormatted: null,
				status: 'FAILURE_MISSING_CONTENT',
				sale: false,
				openboxPrice: -1,
			})
			console.error(`Element ${NEW_PRICE_SELECTOR} found, but 'content' attribute was empty or null.`)
		}

	}
	catch (e: unknown) {
		// General error handling for navigation or selection failures
		const error = e as Error
		console.error('\nAn error occurred during scraping:', error.message)
		console.error('The selector might not exist or the page structure may have changed.')

		// Log a failure result even on exception
		finalResult.push({
			productUrl: url,
			priceSelector: NEW_PRICE_SELECTOR,
			extractedPrice: -1,
			priceFormatted: null,
			status: 'FAILURE_EXCEPTION',
			errorMessage: error.message,
			sale: false,
			openboxPrice: -1,
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