import pino from 'pino'
import { AsyncLocalStorage } from 'async_hooks'
import path from 'path'

export const traceStorage = new AsyncLocalStorage<string>()

export const logger = pino({
	mixin: () => ({ traceId: traceStorage.getStore() }),
	transport: {
		targets: [
			{ target: 'pino-pretty', options: { colorize: true, ignore: 'pid,hostname' } },
			{ target: 'pino/file', options: { destination: path.join(process.cwd(), 'app.log'), append: true } },
		]
	}
})
