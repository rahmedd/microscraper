import { logger, traceStorage } from './logger'
import { parentPort, workerData } from 'worker_threads'
import { scrapePrice } from './scraper'

(async () => {
	const { url, traceId } = workerData as { url: string, traceId: string }
	await traceStorage.run(traceId, async () => {
		const result = await scrapePrice(url)
		parentPort?.postMessage(result)
	})
})()
