import { logger, traceStorage } from './logger'
import { parentPort, workerData } from 'worker_threads'
import { getScraper } from './scrapers'

(async () => {
	const { url, traceId, store } = workerData as { url: string, traceId: string, store: string }
	await traceStorage.run(traceId, async () => {
		const scrape = getScraper(store)
		const result = await scrape(url)
		parentPort?.postMessage(result)
	})
})()

