import { chromium, type Browser, type Page } from 'playwright'
import { ScrapeResult } from './types/scrape-result'
import type { PRICE_COND } from './schema'

// The specific selector requested by the user
const NEW_PRICE_SELECTOR = '#pricing'
const OPENBOX_PRICE_SELECTOR = '#opCostNew'
const SALE_SELECTOR = '.standardDiscount'

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
		// Ensure storeid is appended to the url
		const storeId = process.env.MICRO_STORE_ID
		let finalUrl = url
		if (storeId) {
			try {
				const parsedUrl = new URL(url)
				parsedUrl.searchParams.set('storeid', storeId)
				finalUrl = parsedUrl.toString()
			}
			catch (e) {
				console.error('Invalid URL passed to scraper:', url)
			}
		}

		// 1. Navigate to the target URL
		console.error(`Navigating to ${finalUrl}`)
		await page.goto(finalUrl, { timeout: 10000 })

		try {
			// Wait for the button to be visible before clicking
			const closeButton = page.locator('.close-button')
			await closeButton.waitFor({ state: 'visible', timeout: 5000 })
			await closeButton.click()
			console.error('Clicked the close button.')
		}
		catch {
			console.error('Close button not found or not clickable, proceeding without clicking.')
		}

		// --- Define all your locators first ---
		const priceLocator = page.locator(NEW_PRICE_SELECTOR)
		const openboxPriceLocator = page.locator(OPENBOX_PRICE_SELECTOR) // Using the correct ID
		const saleLocator = page.locator(SALE_SELECTOR)

		// 2. Wait for the *mandatory* element to exist
		console.error(`Waiting for element: ${NEW_PRICE_SELECTOR}`)
		await priceLocator.waitFor({ state: 'attached', timeout: 10000 })
		const priceContent = await priceLocator.getAttribute('content')

		// 3. Safely get the *optional* open-box price
		let openboxPriceContent = null
		try {
			// Give it 1 second to appear. If it doesn't, we'll just move on.
			await openboxPriceLocator.waitFor({ state: 'attached', timeout: 5000 })

			// Now that we know it exists, get the attribute
			openboxPriceContent = await openboxPriceLocator.textContent()
		}
		catch {
			// TimeoutError: Element not found, which is fine for an optional element.
			console.error('Note: Openbox price not found (which is OK).')
		}

		// 4. Safely check for the *optional* sale element
		// .count() is a fast, non-waiting way to check for existence.
		// It's safe to use here since the main element has already loaded.
		const saleCount = await saleLocator.count()
		const isSale = saleCount > 0
		const openboxNum = openboxPriceContent ? parseFloat(openboxPriceContent.split('$')[1]) : undefined

		const pageTitle = await page.title()

		// 5. Push the full result
		if (priceContent) {
			const pricesObj: { condition: PRICE_COND, price: number }[] = []
			pricesObj.push({ condition: 'NEW', price: Number(priceContent) })
			
			if (openboxNum) {
				pricesObj.push({ condition: 'OPENBOX', price: openboxNum })
			}

			finalResult.push({
				productUrl: url,
				productName: pageTitle,
				prices: pricesObj,
				status: 'SUCCESS',
				sale: isSale, // Add your new data
			})
			console.error('\nExtraction successful. JSON output prepared.')
		}
		else {
			finalResult.push({
				productUrl: url,
				prices: [],
				status: 'FAILURE_MISSING_CONTENT',
				sale: false,
			})
			console.error(`Element ${NEW_PRICE_SELECTOR} found, but 'content' attribute was empty or null.`)
		}

	}
	// ... rest of your code (catch, finally) ...
	catch (e: unknown) {
		// General error handling for navigation or selection failures
		const error = e as Error
		console.error('\nAn error occurred during scraping:', error.message)
		console.error('The selector might not exist or the page structure may have changed.')

		// Log a failure result even on exception
		finalResult.push({
			productUrl: url,
			prices: [],
			status: 'FAILURE_EXCEPTION',
			errorMessage: error.message,
			sale: false,
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