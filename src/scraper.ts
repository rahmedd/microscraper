// Import the necessary modules from Playwright
import { chromium, type Browser, type Page } from 'playwright'
import * as dotenv from 'dotenv'
dotenv.config()

// The specific selector requested by the user
const PRICE_SELECTOR = '#pricing'

// Define a type for the structured result
export type ScrapeResult = {
	productUrl: string;
	priceSelector: string;
	extractedPrice: number;
	priceFormatted: string | null;
	status: 'SUCCESS' | 'FAILURE_MISSING_CONTENT' | 'FAILURE_EXCEPTION';
	errorMessage?: string;
}

/**
 * Launches a Playwright browser, navigates to the product page,
 * waits for the specific pricing element, and extracts its 'content' attribute.
 *
 * NOTE: This function is now exported for use by a separate scheduler file.
 */
async function scrapePrice(productUrl: string): Promise<ScrapeResult[]> {
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
		console.error(`Navigating to ${productUrl}`)
		await page.goto(productUrl, { timeout: 60000 })

		// 2. Wait for the specific element to be present in the DOM.
		console.error(`Waiting for element: ${PRICE_SELECTOR}`)
		await page.waitForSelector(PRICE_SELECTOR, { state: 'attached', timeout: 10000 })

		// 3. Use page.locator() and getAttribute() to replicate the desired operation.
		const priceLocator = page.locator(PRICE_SELECTOR)
		const priceContent = await priceLocator.getAttribute('content')

		// 4. Structure the output as an array of objects for n8n compatibility
		if (priceContent) {
			finalResult.push({
				productUrl: productUrl,
				priceSelector: PRICE_SELECTOR,
				extractedPrice: Number(priceContent),
				priceFormatted: `$${priceContent}`,
				status: 'SUCCESS'
			})
			console.error('\nExtraction successful. JSON output prepared.')
		}
		else {
			finalResult.push({
				productUrl: productUrl,
				priceSelector: PRICE_SELECTOR,
				extractedPrice: -1,
				priceFormatted: null,
				status: 'FAILURE_MISSING_CONTENT'
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
			productUrl: productUrl,
			priceSelector: PRICE_SELECTOR,
			extractedPrice: -1,
			priceFormatted: null,
			status: 'FAILURE_EXCEPTION',
			errorMessage: error.message
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