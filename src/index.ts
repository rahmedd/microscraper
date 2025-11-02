import 'dotenv/config'

import { honoApp } from './api'
import { startScheduler } from './scheduler'
import { registerListeners, slackApp } from './slack'
import { checkEnvVars } from './utils'
import { serve } from '@hono/node-server'

checkEnvVars();

(async () => {
	// Register listeners
	registerListeners(slackApp)

	// Start your slack app
	await slackApp.start(process.env.PORT || 3000)
	slackApp.logger.info('⚡️ Bolt app is running!')
})()


serve({
	fetch: honoApp.fetch,
	port: 3000
}, (info) => {
	console.log(`Server is running on http://localhost:${info.port}`)
})

// Start the scheduler
startScheduler()