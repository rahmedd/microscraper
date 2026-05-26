import { ScrapeResult } from '../types/scrape-result'
import { logger } from '../logger'

export async function scrapePrice(url: string): Promise<ScrapeResult[]> {
	logger.info(`Fetching gas prices from ${url}`)
	const finalResult: ScrapeResult[] = []

	try {
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
				'Accept': 'application/json, text/plain, */*',
			}
		})

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`)
		}

		const dataText = await response.text()
		logger.info(`Received data from gasco API: ${dataText.substring(0, 500)}`)

		let data
		try {
			data = JSON.parse(dataText)
		} catch (e) {
			logger.error(`Failed to parse gasco response as JSON: ${e}`)
			throw new Error('Invalid JSON response')
		}

		const gasPrices = Object.values(data || {})[0] as Record<string, string> | undefined
		const regPrice = parseFloat(gasPrices?.regular || '')
		const premPrice = parseFloat(gasPrices?.premium || '')

		const baseUrl = url.split('#')[0]

		const addResult = (grade: string, price: number, name: string) => {
			if (!isNaN(price) && (!url.includes('#') || url.endsWith(`#${grade}`))) {
				finalResult.push({
					productUrl: `${baseUrl}#${grade}`,
					productName: name,
					prices: [{ condition: 'NEW', price }],
					status: 'SUCCESS',
					sale: false,
				})
			}
		}

		addResult('regular', regPrice, 'gasco Regular Gas')
		addResult('premium', premPrice, 'gasco Premium Gas')

		if (finalResult.length === 0) {
			finalResult.push({
				productUrl: url,
				prices: [],
				status: 'FAILURE_MISSING_CONTENT',
				sale: false,
			})
		}

	} catch (error: any) {
		logger.error(`An error occurred during gasco scraping: ${error.message}`)
		finalResult.push({
			productUrl: url,
			prices: [],
			status: 'FAILURE_EXCEPTION',
			errorMessage: error.message,
			sale: false,
		})
	}

	return finalResult
}
