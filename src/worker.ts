
import { parentPort, workerData } from 'worker_threads'
import { scrapePrice } from './scraper'

(async () => {
	const { url } = workerData as { url: string }
	const result = await scrapePrice(url)
	parentPort?.postMessage(result)
})()
