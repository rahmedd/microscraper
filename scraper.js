// Import the necessary modules from Playwright
const { chromium } = require('playwright');
const dotenv = require('dotenv');
dotenv.config();

// The URL of the product page to scrape
const PRODUCT_URL = process.env.CS_URL;
// The specific selector requested by the user
const PRICE_SELECTOR = '#pricing';

/**
 * Launches a Playwright browser, navigates to the product page,
 * waits for the specific pricing element, and extracts its 'content' attribute.
 *
 * NOTE: This function is now exported for use by a separate scheduler file.
 */
async function scrapePrice() {
    // Use console.error for all status/debugging messages to keep stdout clean for JSON.
    console.error("Starting Playwright to scrape...");

    // Launch Chromium in headless mode, but use arguments to bypass common bot detection
    const browser = await chromium.launch({
        headless: true, // Switched back to true, with anti-detection arguments below
        args: [
            // Adds common arguments to mimic a real browser and avoid detection
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            // Disables the most common Playwright detection (navigator.webdriver)
            '--disable-blink-features=AutomationControlled', 
        ],
        // Set a realistic viewport size to match a typical desktop browser
        viewport: { width: 1280, height: 720 } 
    });
    
    // Create a new page and set a common desktop user agent string
    const page = await browser.newPage({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
    });

    // Initialize the array that will hold the final structured result for n8n
    let finalResult = [];

    try {
        // 1. Navigate to the target URL
        console.error(`Navigating to ${PRODUCT_URL}`);
        await page.goto(PRODUCT_URL, { timeout: 60000 });

        // 2. Wait for the specific element to be present in the DOM.
        console.error(`Waiting for element: ${PRICE_SELECTOR}`);
        await page.waitForSelector(PRICE_SELECTOR, { state: "attached", timeout: 10000 });

        // 3. Use page.locator() and getAttribute() to replicate the desired operation.
        const priceLocator = page.locator(PRICE_SELECTOR);
        const priceContent = await priceLocator.getAttribute('content');

        // 4. Structure the output as an array of objects for n8n compatibility
        if (priceContent) {
            finalResult.push({
                productUrl: PRODUCT_URL,
                priceSelector: PRICE_SELECTOR,
                extractedPrice: priceContent,
                priceFormatted: `$${priceContent}`,
                status: "SUCCESS"
            });
            console.error("\nExtraction successful. JSON output prepared.");
        } else {
            finalResult.push({
                productUrl: PRODUCT_URL,
                priceSelector: PRICE_SELECTOR,
                extractedPrice: null,
                priceFormatted: null,
                status: "FAILURE_MISSING_CONTENT"
            });
            console.error(`Element ${PRICE_SELECTOR} found, but 'content' attribute was empty or null.`);
        }

    } catch (e) {
        // General error handling for navigation or selection failures
        console.error("\nAn error occurred during scraping:", e.message);
        console.error("The selector might not exist or the page structure may have changed.");
        
        // Log a failure result even on exception
        finalResult.push({
            productUrl: PRODUCT_URL,
            priceSelector: PRICE_SELECTOR,
            extractedPrice: null,
            priceFormatted: null,
            status: "FAILURE_EXCEPTION",
            errorMessage: e.message
        });

    } finally {
        // Output the JSON array to standard output (stdout) for n8n consumption
        // This output is what an external process (like n8n) would read.
        console.log(JSON.stringify(finalResult));
        
        // Ensure the browser is closed
        await browser.close();
        console.error("\nPlaywright browser closed.");
    }
}

// Export the function for the scheduler to use
module.exports = { scrapePrice };
