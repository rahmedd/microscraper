// Define a type for the structured result
export type ScrapeResult = {
	productUrl: string
	extractedPrice: number
	openboxPrice: number
	sale: boolean
	status: 'SUCCESS' | 'FAILURE_MISSING_CONTENT' | 'FAILURE_EXCEPTION'
	errorMessage?: string
}
