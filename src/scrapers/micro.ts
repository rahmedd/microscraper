import { chromium, type Browser, type Page } from 'playwright'
import { ScrapeResult } from '../types/scrape-result'
import type { PRICE_COND } from '../schema'
import { logger } from '../logger'

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
	logger.info('Starting Playwright to scrape...')
	const finalResult: ScrapeResult[] = []
	let browser: Browser | null = null

	try {
		// Launch Chromium in headless mode, but use arguments to bypass common bot detection
		browser = await chromium.launch({
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
				logger.error(`Invalid URL passed to scraper: ${url}`)
			}
		}

		// 1. Navigate to the target URL
		logger.info(`Navigating to ${finalUrl}`)
		await page.goto(finalUrl, { timeout: 10000 })

		try {
			// Wait for the button to be visible before clicking
			const closeButton = page.locator('.close-button')
			await closeButton.waitFor({ state: 'visible', timeout: 5000 })
			await closeButton.click()
			logger.info('Clicked the close button.')
		}
		catch {
			logger.info('Close button not found or not clickable, proceeding without clicking.')
		}

		// --- Define all your locators first ---
		const priceLocator = page.locator(NEW_PRICE_SELECTOR)
		const openboxPriceLocator = page.locator(OPENBOX_PRICE_SELECTOR) // Using the correct ID
		const saleLocator = page.locator(SALE_SELECTOR)

		// 2. Wait for the *mandatory* element to exist
		logger.info(`Waiting for element: ${NEW_PRICE_SELECTOR}`)
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
			logger.info('Note: Openbox price not found (which is OK).')
		}

		// 4. Safely check for the *optional* sale element
		// .count() is a fast, non-waiting way to check for existence.
		// It's safe to use here since the main element has already loaded.
		const saleCount = await saleLocator.count()
		const isSale = saleCount > 0
		const openboxNum = openboxPriceContent ? parseFloat(openboxPriceContent.split('$')[1]) : undefined

		const pageTitle = await page.title()

		// Safely check inventory count for NEW items
		let inventoryCount = -1;
		try {
			const inventoryLocator = page.locator('.inventoryCnt');
			const count = await inventoryLocator.count();
			if (count > 0) {
				const invCountStr = await inventoryLocator.first().evaluate(el => el.firstChild?.textContent);
				if (invCountStr) {
					const parsed = parseInt(invCountStr.trim(), 10);
					if (!isNaN(parsed)) {
						inventoryCount = parsed;
						logger.info(`Inventory count found: ${inventoryCount}`);
					}
				}
			}
			else {
				inventoryCount = 0;
				logger.info(`Inventory count element not found, treating as out of stock.`);
			}
		}
		catch (e: any) {
			logger.info(`Note: Error checking inventory count (which is OK). Error: ${e.message}`);
		}

		// 5. Push the full result
		if (priceContent) {
			const pricesObj: { condition: PRICE_COND, price: number }[] = []

			if (inventoryCount === 0) {
				logger.info('NEW inventory count is 0, omitting NEW condition from results.')
			}
			else {
				pricesObj.push({ condition: 'NEW', price: Number(priceContent) })
			}

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
			logger.info('Extraction successful. JSON output prepared.')
		}
		else {
			finalResult.push({
				productUrl: url,
				prices: [],
				status: 'FAILURE_MISSING_CONTENT',
				sale: false,
			})
			logger.error(`Element ${NEW_PRICE_SELECTOR} found, but 'content' attribute was empty or null.`)
		}

	}
	catch (e: unknown) {
		// General error handling for navigation or selection failures
		const error = e as Error
		// Playwright sometimes inserts ANSI colors in its error messages which break logs, so we strip them:
		const cleanMessage = error.message.replace(/\x1B\[[0-9;]*m/g, '')
		logger.error(`An error occurred during scraping: ${cleanMessage}`)
		logger.error('The selector might not exist or the page structure may have changed.')

		// Log a failure result even on exception
		finalResult.push({
			productUrl: url,
			prices: [],
			status: 'FAILURE_EXCEPTION',
			errorMessage: cleanMessage,
			sale: false,
		})

	}
	finally {
		// Ensure the browser is closed
		if (browser) {
			await browser.close()
			logger.info('Playwright browser closed.')
		}
	}
	return finalResult
}

// Export the function for the registry to use
export { scrapePrice }
