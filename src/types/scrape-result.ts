import type { PRICE_COND } from '../schema'

// Define a type for the structured result
export type ScrapeResult = {
	productUrl: string
	productName?: string
	prices: { condition: PRICE_COND; price: number }[]
	sale: boolean
	status: 'SUCCESS' | 'FAILURE_MISSING_CONTENT' | 'FAILURE_EXCEPTION'
	errorMessage?: string
}
