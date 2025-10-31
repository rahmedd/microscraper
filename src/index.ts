import 'dotenv/config'

import { slackApp, registerListeners } from './slack'
import { startScheduler } from './scheduler'
import { checkEnvVars } from './utils'
import { serve } from '@hono/node-server'
import { honoApp } from './api'

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