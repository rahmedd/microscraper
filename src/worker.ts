
import { parentPort, workerData } from 'worker_threads'
import { scrapePrice } from './scraper'
import { products } from './db/schema'

(async () => {
	const { product } = workerData as { product: typeof products.$inferSelect }
	const result = await scrapePrice(product)
	parentPort?.postMessage(result)
})()
