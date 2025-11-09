// import { describe, it, expect, vi, beforeEach } from 'vitest'
// import { shouldUpdate } from '../price-processor'
// import { ScrapeResult } from '../types/scrape-result'
// import { Product } from '../schema'

// describe('shouldUpdate', () => {
// 	beforeEach(() => {
// 		vi.clearAllMocks()
// 	})

// 	const mockProduct: Product = {
// 		id: 1,
// 		url: 'http://example.com/product',
// 		threshold: 100,
// 		enabled: true,
// 		createdAt: new Date(),
// 		updatedAt: new Date(),
// 	}

// 	it('should not insert price or send slack message if extractedPrice is not below threshold', async () => {
// 		const result: ScrapeResult = {
// 			productUrl: 'http://example.com/product',
// 			extractedPrice: 120,
// 			status: 'SUCCESS',
// 			sale: false,
// 			openboxPrice: 0,
// 		}

// 		await shouldUpdate(result, mockProduct)
// 	})

// 	it('should insert new price and send slack message if no previous price exists and price is below threshold', async () => {
// 		const result: ScrapeResult = {
// 			productUrl: 'http://example.com/product',
// 			extractedPrice: 120,
// 			status: 'SUCCESS',
// 			sale: false,
// 			openboxPrice: 0,
// 		}

// 		await shouldUpdate(result, mockProduct)
// 	})

// 	it('should insert new price and send slack message if price has changed and is below threshold', async () => {
// 		const result: ScrapeResult = {
// 			productUrl: 'http://example.com/product',
// 			extractedPrice: 70,
// 			status: 'SUCCESS',
// 			sale: false,
// 			openboxPrice: 0,
// 		}

// 		await shouldUpdate(result, mockProduct)
// 	})

// 	it('should not insert new price or send slack message if price has not changed', async () => {
// 		const result: ScrapeResult = {
// 			productUrl: 'http://example.com/product',
// 			extractedPrice: 80,
// 			status: 'SUCCESS',
// 			sale: false,
// 		}
// 	})

// 	it('should insert new price and send slack message if sale status has changed', async () => {
// 		const result: ScrapeResult = {
// 			productUrl: 'http://example.com/product',
// 			extractedPrice: 80,
// 			status: 'SUCCESS',
// 			sale: true, // Sale status changed
// 		}

// 		await shouldUpdate(result, mockProduct)
// 	})
// })
