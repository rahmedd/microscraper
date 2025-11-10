
import { parentPort, workerData } from 'worker_threads'
import { scrapeMicro } from './scrapers/micro'

(async () => {
	const { url } = workerData as { url: string }
	const result = await scrapeMicro(url)
	parentPort?.postMessage(result)
})()
